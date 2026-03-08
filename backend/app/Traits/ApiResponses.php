<?php

namespace App\Traits;

trait ApiResponses
{
    //
    protected function ok($message, $data = [])
    {
        return $this->success($message, $data, 200);
    }

    protected function success($message, $data = [], $statusCode = 200)
    {
        return response()->json([
            'data' => $data,
            'message' => $message,
            'status' => $statusCode
        ], $statusCode);
    }

    protected function created($message, $data = [])
    {
        return $this->success($message, $data, 201);
    }

    protected function error($message, $statusCode = 600)
    {
        return response()->json([
            'error' => $message,
            'status' => $statusCode
        ], $statusCode);
    }

    protected function notFound($message)
    {
        return $this->error($message, 404);
    }

    protected function unauthorized($message)
    {
        return $this->error($message, 403);
    }
}
