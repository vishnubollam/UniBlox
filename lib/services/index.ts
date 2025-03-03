import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

interface LambdaEvent {
  body: string;
}

// Define the response type for Lambda
interface LambdaResponse {
  statusCode: number;
  headers: { 'Content-Type': string };
  body: string;
}

const { SageMakerRuntimeClient, InvokeEndpointCommand } = require('@aws-sdk/client-sagemaker-runtime');

const client = new SageMakerRuntimeClient({ region: process.env.AWS_REGION || 'us-east-1' });

exports.handler = async (event : LambdaEvent): Promise<LambdaResponse> => {
  const endpointName = process.env.SAGEMAKER_ENDPOINT || 'flask-endpoint';

  try {
    if (!event?.body) {
      return createResponse(400, { error: 'No request body provided' });
    }

  let body :{text : string };
    try {
      body = JSON.parse(event.body);
    } catch (parseError) {
      return createResponse(400, { error: 'Invalid JSON in request body' });
    }
    const text = body.text;
    console.log('Input text:', text, 'Type:', typeof text);

    
    if (!text || typeof text !== 'string') {
      return createResponse(400, { error: 'Text must be a string' });
    }
    if (!isNaN(Number(text)) && text.trim() !== '') {
      return createResponse(400, { error: 'Text must not be a number' });
    }

    const payload = Buffer.from(JSON.stringify({ text }));

    const command = new InvokeEndpointCommand({
      EndpointName: endpointName,
      Body: payload,
      ContentType: 'application/json',
      Accept: 'application/json',
    });

    console.log('Invoking SageMaker endpoint:', endpointName);
    const result = await client.send(command);
    const response = JSON.parse(new TextDecoder().decode(result.Body));

    return createResponse(200, { result: response });

  } 

  catch (error: unknown) {
    // Explicitly handle the 'unknown' type
    let errorMessage: string;
    if (error instanceof Error) {
      errorMessage = error.message;
    } else {
      errorMessage = String(error) || 'Unknown error';
    }

    console.error('Error invoking SageMaker endpoint:', error);
    return createResponse(500, {
      error: 'Failed to invoke model',
      details: errorMessage,
    });
  }
};

function createResponse(statusCode: number, body: { error?: string; result?: any; details?: any; }) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}