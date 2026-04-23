import { NextRequest, NextResponse } from 'next/server'
import { fulfillFromPaymentIntent } from '@/lib/fulfillment'
import { getRequestId, jsonWithRequestId, logEvent } from '@/lib/observability'

export async function POST(request: NextRequest) {
  const requestId = getRequestId(request)
  try {
    const { paymentIntentId, shipping } = await request.json()
    logEvent('info', 'fulfill_order.requested', {
      requestId,
      route: '/api/fulfill-order',
      paymentIntentId: paymentIntentId || null,
    })

    if (!paymentIntentId) {
      return jsonWithRequestId(
        { error: 'Payment Intent ID is required' },
        requestId,
        { status: 400 }
      )
    }
    const result = await fulfillFromPaymentIntent(paymentIntentId, shipping)
    if (!result.success) {
      logEvent('warn', 'fulfill_order.failed', {
        requestId,
        paymentIntentId,
        status: result.status,
        error: result.error,
      })
      return jsonWithRequestId({ success: false, error: result.error }, requestId, { status: result.status })
    }
    logEvent('info', 'fulfill_order.succeeded', {
      requestId,
      paymentIntentId,
      printfulOrderId: result.orderId,
      alreadyFulfilled: result.alreadyFulfilled,
    })

    return jsonWithRequestId(
      {
        success: true,
        orderId: result.orderId,
        printfulOrderId: result.orderId,
        alreadyFulfilled: result.alreadyFulfilled,
        message: result.alreadyFulfilled
          ? 'Order was already fulfilled.'
          : 'Order fulfilled successfully!',
      },
      requestId
    )
  } catch (error: any) {
    logEvent('error', 'fulfill_order.exception', {
      requestId,
      error: error?.message || 'Failed to fulfill order',
    })
    const errorMessage = error?.message || 'Failed to fulfill order'

    return jsonWithRequestId(
      {
        success: false,
        error: errorMessage,
      },
      requestId,
      { status: 500 }
    )
  }
}
