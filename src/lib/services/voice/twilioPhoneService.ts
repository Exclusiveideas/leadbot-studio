import Twilio from "twilio";

type AvailableNumber = {
  phoneNumber: string;
  friendlyName: string;
  locality: string;
  region: string;
  isoCountry: string;
};

type PurchasedNumber = {
  phoneNumber: string;
  sid: string;
};

function getTwilioClient(): Twilio.Twilio {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error("TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are required");
  }

  return new Twilio.Twilio(accountSid, authToken);
}

export async function searchAvailableNumbers(
  country: string,
  areaCode?: string,
): Promise<AvailableNumber[]> {
  const client = getTwilioClient();

  const params: Record<string, unknown> = { limit: 10, voiceEnabled: true };
  if (areaCode) {
    params.areaCode = parseInt(areaCode, 10);
  }

  const numbers = await client
    .availablePhoneNumbers(country)
    .local.list(params);

  return numbers.map((n) => ({
    phoneNumber: n.phoneNumber,
    friendlyName: n.friendlyName,
    locality: n.locality,
    region: n.region,
    isoCountry: n.isoCountry,
  }));
}

export async function purchaseNumber(
  phoneNumber: string,
  chatbotId: string,
): Promise<PurchasedNumber> {
  const client = getTwilioClient();

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!baseUrl) {
    throw new Error(
      "NEXT_PUBLIC_APP_URL is required for webhook configuration",
    );
  }

  const incoming = await client.incomingPhoneNumbers.create({
    phoneNumber,
    voiceUrl: `${baseUrl}/api/webhooks/twilio/voice`,
    voiceMethod: "POST",
    statusCallback: `${baseUrl}/api/webhooks/twilio/voice-status`,
    statusCallbackMethod: "POST",
    friendlyName: `LeadBot Voice - ${chatbotId}`,
  });

  return {
    phoneNumber: incoming.phoneNumber,
    sid: incoming.sid,
  };
}

export async function releaseNumber(phoneSid: string): Promise<void> {
  const client = getTwilioClient();
  await client.incomingPhoneNumbers(phoneSid).remove();
}
