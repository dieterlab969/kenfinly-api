<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PaymentGateway;
use App\Models\PaymentGatewayCredential;
use App\Models\PaymentGatewayAuditLog;
use App\Services\EncryptionService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

/**
 * Controller for managing Payment Gateways and their credentials.
 *
 * Provides endpoints for CRUD operations on gateways and credentials,
 * toggling gateway status, verifying credentials, and retrieving audit logs.
 * Protected by authentication and admin middleware.
 */
class PaymentGatewayController extends Controller
{
    /**
     * PaymentGatewayController constructor.
     * Applies authentication and admin middleware to relevant endpoints.
     */
    public function __construct()
    {
        $this->middleware('auth:api');
        $this->middleware('super_admin')->only(['index', 'store', 'show', 'update', 'destroy', 'storeCredential', 'updateCredential', 'deleteCredential', 'toggleGateway']);
    }

    /**
     * List payment gateways with optional filters and pagination.
     *
     * @param Request $request HTTP request with optional filters: is_active, environment.
     * @return JsonResponse Paginated list of payment gateways with credentials and creator info.
     */
    public function index(Request $request): JsonResponse
    {
        $gateways = PaymentGateway::with('credentials', 'createdBy')
            ->when($request->get('is_active'), fn($q) => $q->where('is_active', true))
            ->when($request->get('environment'), fn($q) => $q->where('environment', $request->get('environment')))
            ->latest()
            ->paginate(15);

        return response()->json($gateways);
    }

    /**
     * Create a new payment gateway.
     *
     * @param Request $request HTTP request with gateway details.
     * @return JsonResponse Newly created payment gateway.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|unique:payment_gateways',
            'slug' => 'required|string|unique:payment_gateways',
            'description' => 'nullable|string',
            'environment' => 'required|in:sandbox,production',
            'metadata' => 'nullable|array',
        ]);

        $gateway = PaymentGateway::create(array_merge(
            $validated,
            ['created_by' => auth()->id()]
        ));

        PaymentGatewayAuditLog::logAction(
            'create',
            auth()->user(),
            $gateway,
            "Created payment gateway: {$gateway->name}"
        );

        return response()->json($gateway, 201);
    }

    /**
     * Show details of a specific payment gateway.
     *
     * @param PaymentGateway $paymentGateway The payment gateway instance.
     * @return JsonResponse Payment gateway with credentials and audit logs.
     */
    public function show(PaymentGateway $paymentGateway): JsonResponse
    {
        return response()->json($paymentGateway->load('credentials', 'auditLogs.user'));
    }

    /**
     * Update a payment gateway's description and metadata.
     *
     * @param Request $request HTTP request with update data.
     * @param PaymentGateway $paymentGateway The payment gateway instance.
     * @return JsonResponse Updated payment gateway.
     */
    public function update(Request $request, PaymentGateway $paymentGateway): JsonResponse
    {
        $validated = $request->validate([
            'description' => 'nullable|string',
            'metadata' => 'nullable|array',
        ]);

        $oldValues = $paymentGateway->only(['description', 'metadata']);
        $paymentGateway->update(array_merge($validated, ['updated_by' => auth()->id()]));

        PaymentGatewayAuditLog::logAction(
            'update',
            auth()->user(),
            $paymentGateway,
            "Updated payment gateway: {$paymentGateway->name}",
            $oldValues,
            $paymentGateway->only(['description', 'metadata'])
        );

        return response()->json($paymentGateway);
    }

    /**
     * Delete a payment gateway.
     *
     * @param PaymentGateway $paymentGateway The payment gateway instance.
     * @return JsonResponse Success message.
     */
    public function destroy(PaymentGateway $paymentGateway): JsonResponse
    {
        $name = $paymentGateway->name;
        $paymentGateway->delete();

        PaymentGatewayAuditLog::logAction(
            'delete',
            auth()->user(),
            null,
            "Deleted payment gateway: {$name}"
        );

        return response()->json(['message' => 'Gateway deleted successfully']);
    }

    /**
     * Toggle the active status of a payment gateway.
     *
     * @param PaymentGateway $paymentGateway The payment gateway instance.
     * @return JsonResponse Status message and updated gateway.
     */
    public function toggleGateway(PaymentGateway $paymentGateway): JsonResponse
    {
        $action = $paymentGateway->is_active ? 'deactivate' : 'activate';
        $paymentGateway->toggle();

        PaymentGatewayAuditLog::logAction(
            $action,
            auth()->user(),
            $paymentGateway,
            "{$action}: {$paymentGateway->name}"
        );

        return response()->json([
            'message' => "Gateway {$action}d successfully",
            'gateway' => $paymentGateway
        ]);
    }

    /**
     * Add a new credential to a payment gateway.
     *
     * @param Request $request HTTP request with credential data.
     * @param PaymentGateway $paymentGateway The payment gateway instance.
     * @return JsonResponse Success message and credential data.
     */
    public function storeCredential(Request $request, PaymentGateway $paymentGateway): JsonResponse
    {
        $validated = $request->validate([
            'environment' => 'required|in:sandbox,production',
            'credential_key' => 'required|string',
            'credential_value' => 'required|string',
            'is_test' => 'boolean',
        ]);

        $exists = $paymentGateway->credentials()
            ->where('environment', $validated['environment'])
            ->where('credential_key', $validated['credential_key'])
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'Credential already exists'], 409);
        }

        $credential = new PaymentGatewayCredential([
            'environment' => $validated['environment'],
            'credential_key' => $validated['credential_key'],
            'is_test' => $validated['is_test'] ?? false,
            'updated_by' => auth()->id(),
        ]);

        $credential->setCredentialValue($validated['credential_value']);
        $paymentGateway->credentials()->save($credential);

        PaymentGatewayAuditLog::logAction(
            'credential_add',
            auth()->user(),
            $paymentGateway,
            "Added credential for gateway: {$paymentGateway->name}",
            [],
            ['key' => $validated['credential_key'], 'environment' => $validated['environment']]
        );

        return response()->json([
            'message' => 'Credential added successfully',
            'credential' => $credential->only(['id', 'environment', 'credential_key', 'is_test', 'verified'])
        ], 201);
    }

    /**
     * Update an existing credential's value.
     *
     * @param Request $request HTTP request with new credential value.
     * @param PaymentGateway $paymentGateway The payment gateway instance.
     * @param PaymentGatewayCredential $credential The credential instance.
     * @return JsonResponse Success message and updated credential data.
     */
    public function updateCredential(Request $request, PaymentGateway $paymentGateway, PaymentGatewayCredential $credential): JsonResponse
    {
        $validated = $request->validate([
            'credential_value' => 'required|string',
        ]);

        $credential->setCredentialValue($validated['credential_value']);
        $credential->update(['updated_by' => auth()->id()]);

        PaymentGatewayAuditLog::logAction(
            'credential_update',
            auth()->user(),
            $paymentGateway,
            "Updated credential for gateway: {$paymentGateway->name}",
            [],
            ['key' => $credential->credential_key, 'environment' => $credential->environment]
        );

        return response()->json([
            'message' => 'Credential updated successfully',
            'credential' => $credential->only(['id', 'environment', 'credential_key', 'verified'])
        ]);
    }

    /**
     * Delete a credential from a payment gateway.
     *
     * @param PaymentGateway $paymentGateway The payment gateway instance.
     * @param PaymentGatewayCredential $credential The credential instance.
     * @return JsonResponse Success message.
     */
    public function deleteCredential(PaymentGateway $paymentGateway, PaymentGatewayCredential $credential): JsonResponse
    {
        $credentialKey = $credential->credential_key;
        $credential->delete();

        PaymentGatewayAuditLog::logAction(
            'credential_delete',
            auth()->user(),
            $paymentGateway,
            "Deleted credential for gateway: {$paymentGateway->name}",
            ['key' => $credentialKey]
        );

        return response()->json(['message' => 'Credential deleted successfully']);
    }

    /**
     * Verify a credential for a payment gateway.
     *
     * @param PaymentGateway $paymentGateway The payment gateway instance.
     * @param PaymentGatewayCredential $credential The credential instance.
     * @return JsonResponse Success message and verified credential data.
     */
    public function verifyCredential(PaymentGateway $paymentGateway, PaymentGatewayCredential $credential): JsonResponse
    {
        $credential->verify();

        PaymentGatewayAuditLog::logAction(
            'credential_verify',
            auth()->user(),
            $paymentGateway,
            "Verified credential for gateway: {$paymentGateway->name}",
            [],
            ['key' => $credential->credential_key, 'verified' => true]
        );

        return response()->json([
            'message' => 'Credential verified successfully',
            'credential' => $credential->only(['id', 'verified', 'verified_at'])
        ]);
    }

    /**
     * Retrieve audit logs for a payment gateway with optional filtering by action.
     *
     * @param PaymentGateway $paymentGateway The payment gateway instance.
     * @param Request $request HTTP request with optional 'action' filter.
     * @return JsonResponse Paginated list of audit logs with user information.
     */
    public function auditLogs(PaymentGateway $paymentGateway, Request $request): JsonResponse
    {
        $logs = $paymentGateway->auditLogs()
            ->with('user')
            ->when($request->get('action'), fn($q) => $q->where('action', $request->get('action')))
            ->latest()
            ->paginate(20);

        return response()->json($logs);
    }
}
