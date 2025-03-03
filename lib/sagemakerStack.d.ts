import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
export declare class SagemakerStack extends cdk.Stack {
    readonly endpointName: string;
    constructor(scope: Construct, id: string, props?: cdk.StackProps);
}
