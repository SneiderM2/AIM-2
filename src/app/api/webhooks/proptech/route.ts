/**
 * @file route.ts
 * @description Endpoint Receptor de Webhooks (Firmas Electrónicas y Pasarela de Pagos PSE/Wompi)
 *              con verificación HMAC-SHA256 en tiempo constante e idempotencia.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  verifyWebhookSignature,
  type PropTechWebhookPayload,
} from '../../../../services/contract-crypto.service';
import { createSupabaseServerClient } from '../../../../lib/supabase/server';

export async function POST(request: NextRequest) {
  const signatureHeader = request.headers.get('x-proptech-signature');
  if (!signatureHeader) {
    return NextResponse.json(
      { error: 'Cabecera criptográfica x-proptech-signature ausente.' },
      { status: 401 }
    );
  }

  const rawBody = await request.text();
  const webhookSecret =
    process.env.PROPTECH_WEBHOOK_SECRET ?? 'whsec_pasarela_wompi_pse_colombia_hmac_sha256';

  const isSignatureValid = verifyWebhookSignature(rawBody, signatureHeader, webhookSecret);
  if (!isSignatureValid) {
    return NextResponse.json(
      { error: 'Firma HMAC-SHA256 inválida. Solicitud rechazada por seguridad.' },
      { status: 403 }
    );
  }

  let payload: PropTechWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as PropTechWebhookPayload;
  } catch {
    return NextResponse.json({ error: 'Payload JSON malformado.' }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  switch (payload.eventType) {
    case 'contract.signature.completed': {
      if (supabase && payload.data.finalSealedDocumentSha256) {
        await supabase
          .from('contracts')
          .update({
            status: 'active',
            final_sealed_document_sha256: payload.data.finalSealedDocumentSha256,
          })
          .eq('id', payload.data.contractId);

        await supabase
          .from('properties')
          .update({ status: 'rented' })
          .eq('id', payload.data.propertyId);
      }
      break;
    }

    case 'payment.canon.succeeded': {
      if (supabase && payload.data.paymentId) {
        await supabase
          .from('payments')
          .update({
            status: 'paid',
            gateway_transaction_id: payload.data.gatewayTransactionId,
            paid_at: payload.occurredAtUtc,
            webhook_payload: payload as unknown as Record<string, unknown>,
          })
          .eq('id', payload.data.paymentId);
      }
      break;
    }

    case 'payment.canon.overdue': {
      if (supabase && payload.data.paymentId) {
        await supabase
          .from('payments')
          .update({
            status: 'overdue',
            webhook_payload: payload as unknown as Record<string, unknown>,
          })
          .eq('id', payload.data.paymentId);
      }
      break;
    }
  }

  return NextResponse.json({
    received: true,
    eventId: payload.eventId,
    eventType: payload.eventType,
    processedAtUtc: new Date().toISOString(),
  });
}
