<?php

namespace App\Http\Requests\Api\V1;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;

class RegisterUserRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            //
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'role' => 'sometimes|string|in:admin,supply_officer,staff',
        ];
    }

     public function withValidator($validator)
{
    $validator->after(function ($validator) {
        if ($this->has('role') && !$validator->errors()->has('role')) {
            $role = $this->input('role');
            
            // Only restrict admin and supply_officer
            if ($role === 'admin' && User::where('role', 'admin')->exists()) {
                $validator->errors()->add('role', 'An administrator already exists. Only one admin is allowed.');
            }

            if ($role === 'supply_officer' && User::where('role', 'supply_officer')->exists()) {
                $validator->errors()->add('role', 'A supply officer already exists. Only one supply officer is allowed.');
            }
            
        }  
    });
 }

    public function messages()
    {
        return [
            'role.in' => 'The selected role is invalid. Must be one of: admin, supply_officer, staff.',
        ];
    }

}
