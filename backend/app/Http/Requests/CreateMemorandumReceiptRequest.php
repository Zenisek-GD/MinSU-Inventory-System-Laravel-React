<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateMemorandumReceiptRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Users with Admin, Supply Officer, or Property Custodia role can create MRs
        return in_array($this->user()->role, ['Admin', 'Supply Officer', 'property_custodia', 'admin', 'supply_officer']);
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'entity_name' => ['required', 'string', 'max:255'],
            'fund_cluster' => ['required', 'string', 'max:100'],
            'office' => ['required', 'string', 'max:255'],
            'accountable_officer' => ['required', 'string', 'max:255'],
            'position' => ['required', 'string', 'max:255'],
            'date_issued' => ['required', 'date'],
            'received_from' => ['required', 'string', 'max:255'],
            'purpose' => ['nullable', 'string', 'max:1000'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.item_name' => ['required', 'string', 'max:255'],
            'items.*.qty' => ['required', 'integer', 'min:1'],
            'items.*.unit' => ['required', 'string', 'max:50'],
            'items.*.property_number' => ['required', 'string', 'max:100', 'unique:mr_items,property_number'],
            'items.*.acquisition_date' => ['required', 'date'],
            'items.*.unit_cost' => ['required', 'numeric', 'min:0'],
            'items.*.condition' => ['required', 'in:Good,Fair,Poor,Damaged,Non-functional'],
            'items.*.remarks' => ['nullable', 'string', 'max:500'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'entity_name.required' => 'Entity name is required.',
            'fund_cluster.required' => 'Fund cluster is required.',
            'office.required' => 'Office is required.',
            'accountable_officer.required' => 'Accountable officer name is required.',
            'position.required' => 'Position is required.',
            'date_issued.required' => 'Date issued is required.',
            'date_issued.date' => 'Date issued must be a valid date.',
            'received_from.required' => 'Received from (source) is required.',
            'items.required' => 'At least one item must be added.',
            'items.min' => 'At least one item must be added.',
            'items.*.item_name.required' => 'Item name is required for all items.',
            'items.*.qty.required' => 'Quantity is required for all items.',
            'items.*.qty.min' => 'Quantity must be at least 1.',
            'items.*.unit.required' => 'Unit is required for all items.',
            'items.*.property_number.required' => 'Property number is required for all items.',
            'items.*.property_number.unique' => 'This property number already exists.',
            'items.*.acquisition_date.required' => 'Acquisition date is required for all items.',
            'items.*.unit_cost.required' => 'Unit cost is required for all items.',
            'items.*.condition.required' => 'Item condition is required.',
            'items.*.condition.in' => 'Item condition must be one of: Good, Fair, Poor, Damaged, Non-functional.',
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
            'items' => 'items',
            'items.*.item_name' => 'item name',
            'items.*.qty' => 'quantity',
            'items.*.unit' => 'unit',
            'items.*.property_number' => 'property number',
            'items.*.acquisition_date' => 'acquisition date',
            'items.*.unit_cost' => 'unit cost',
            'items.*.condition' => 'item condition',
            'items.*.remarks' => 'remarks',
        ];
    }
}
