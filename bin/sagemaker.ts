#!/opt/homebrew/opt/node/bin/node
import * as cdk from 'aws-cdk-lib';
import { SagemakerStack } from '../lib/sagemakerStack';
import { LambdaInvokeStack } from '../lib/lambda-function-stack';

const app = new cdk.App();
const sagemaker =  new SagemakerStack(app,'SagemakerStack');
const lambdaInvokeStack = new LambdaInvokeStack(app, 'LambdaInvokeStack',{
    SageMakerEndpointName: sagemaker.endpointName,
}); 
lambdaInvokeStack.addDependency(sagemaker);