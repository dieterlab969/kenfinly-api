<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PaymentGateway;
use App\Models\PaymentGatewayCredential;
use App\Models\PaymentGatewayAuditLog;
use App\Services\EncryptionService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class PaymentGatewayController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:api');
        $this->middleware('super_admin')->only(['index', 'store', 'show', 'update', 'destroy', 'storeCredential', 'updateCredential', 'deleteCredential', 'toggleGateway']);
    }

    public function index(Request $request): JsonResponse
    {
        $gateways = PaymentGateway::with('credentials', 'createdBy')
            ->when($request->get('is_active'), fn($q) => $q->where('is_active', true))
            ->when($request->get('environment'), fn($q) => $q->where('environment', $request->get('environment')))
            ->latest()
            ->paginate(15);

        return response()->json($gateways);
    }

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

    public function show(PaymentGateway $paymentGateway): JsonResponse
    {
        return response()->json($paymentGateway->load('credentials', 'auditLogs.user'));
    }

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
