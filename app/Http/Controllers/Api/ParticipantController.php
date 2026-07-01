<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\AccountParticipant;
use App\Models\Invitation;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;

class ParticipantController extends Controller
{
    public function invite(Request $request)
    {
        $request->validate([
            'account_id' => 'required|exists:accounts,id',
            'email' => 'required|email',
            'role' => 'required|in:owner,editor,viewer',
        ]);

        $account = Account::findOrFail($request->account_id);

        if ($account->user_id !== auth()->id() && $account->getParticipantRole(auth()->id()) !== 'owner') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $role = Role::where('name', $request->role)->firstOrFail();

        $invitation = Invitation::create([
            'account_id' => $account->id,
            'invited_by' => auth()->id(),
            'role_id' => $role->id,
            'email' => $request->email,
            'token' => Invitation::generateToken(),
            'status' => 'pending',
            'expires_at' => now()->addDays(7),
        ]);

        return response()->json(['message' => 'Invitation sent successfully', 'invitation' => $invitation]);
    }

    public function acceptInvitation(Request $request, $token)
    {
        $invitation = Invitation::where('token', $token)->first();

        if (!$invitation || !$invitation->isPending()) {
            return response()->json(['error' => 'Invalid or expired invitation'], 400);
        }

        if (auth()->user()->email !== $invitation->email) {
            return response()->json(['error' => 'This invitation was sent to a different email address'], 403);
        }

        AccountParticipant::create([
            'account_id' => $invitation->account_id,
            'user_id' => auth()->id(),
            'role_id' => $invitation->role_id,
            'invited_by' => $invitation->invited_by,
            'joined_at' => now(),
        ]);

        $invitation->update(['status' => 'accepted', 'accepted_at' => now()]);

        return response()->json(['message' => 'Invitation accepted successfully']);
    }

    public function listParticipants($accountId)
    {
        $account = Account::findOrFail($accountId);

        if ($account->user_id !== auth()->id() && !$account->hasParticipant(auth()->id())) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $participants = $account->participants()->with(['user', 'role'])->get();
        return response()->json($participants);
    }

    public function removeParticipant(Request $request, $accountId, $userId)
    {
        $account = Account::findOrFail($accountId);

        if ($account->user_id !== auth()->id() && $account->getParticipantRole(auth()->id()) !== 'owner') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        AccountParticipant::where('account_id', $accountId)->where('user_id', $userId)->delete();

        return response()->json(['message' => 'Participant removed successfully']);
    }
}
