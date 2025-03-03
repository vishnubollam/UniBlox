import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apiGateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cdk from 'aws-cdk-lib'
import { Fn } from 'aws-cdk-lib';
import path = require('path');

export class LambdaInvokeStack extends cdk.Stack {
constructor(scope: Construct, id: string, props:{ SageMakerEndpointName: string } & cdk.StackProps) {
    super(scope, id, props);

    const endpointName = Fn.importValue('SageMakerEndpointName');

    // Define Lambda function role
    const lambdaRole = new iam.Role(this, 'LambdaInvokeRole', {
    assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    managedPolicies: [
        iam.ManagedPolicy.fromManagedPolicyArn( this, 
            'AmazonSageMakerFullAccess', 
            'arn:aws:iam::aws:policy/AmazonSageMakerFullAccess'),
        iam.ManagedPolicy.fromManagedPolicyArn(this, 
            'AWSLambdaBasicExecutionRole', 
            'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'),
    ]
    });

    // Define Lambda function that invokes the SageMaker endpoint
    const invokeModelLambda = new lambda.Function(this, 'InvokeModelFunction', {
    runtime: lambda.Runtime.NODEJS_18_X,
    handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname,'services')), // Path to your Lambda code
    environment: {
        SAGEMAKER_ENDPOINT: endpointName ,
    },
    role: lambdaRole
    });

    // Define API Gateway to invoke Lambda function
    const api = new apiGateway.RestApi(this, 'InvokeModelAPI');
    const lambdaIntegration = new apiGateway.LambdaIntegration(invokeModelLambda);
    api.root.addMethod('POST', lambdaIntegration); // POST method to trigger the model invocation 
    }
};

function join(__dirname: string, arg1: string, arg2: string): string {
    throw new Error('Function not implemented.');
}
