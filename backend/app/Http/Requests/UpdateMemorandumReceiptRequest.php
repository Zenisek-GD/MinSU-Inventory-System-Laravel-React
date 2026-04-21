<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMemorandumReceiptRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Only the creator, admin, or supply officer can update an MR
        $mr = $this->route('memorandumReceipt');
        $userRole = strtolower($this->user()->role ?? '');
        return in_array($userRole, ['admin', 'supply_officer']) || $this->user()->id === $mr->created_by;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'entity_name' => ['sometimes', 'string', 'max:255'],
            'fund_cluster' => ['sometimes', 'string', 'max:100'],
            'office' => ['sometimes', 'string', 'max:255'],
            'accountable_officer' => ['sometimes', 'string', 'max:255'],
            'position' => ['sometimes', 'string', 'max:255'],
            'date_issued' => ['sometimes', 'date'],
            'received_from' => ['sometimes', 'string', 'max:255'],
            'purpose' => ['nullable', 'string', 'max:1000'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'date_issued.date' => 'Date issued must be a valid date.',
        ];
    }

    /**
     * Get the error messages for the defined validation rules.
     */
    public function attributes(): array
    {
        return [
            'entity_name' => 'entity name',
            'fund_cluster' => 'fund cluster',
            'office' => 'office',
            'accountable_officer' => 'accountable officer',
            'position' => 'position',
            'date_issued' => 'date issued',
            'received_from' => 'received from',
            'purpose' => 'purpose',
            'notes' => 'notes',
        ];
    }
}
