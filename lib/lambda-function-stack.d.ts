import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
export declare class LambdaInvokeStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: {
        SageMakerEndpointName: string;
    } & cdk.StackProps);
}
