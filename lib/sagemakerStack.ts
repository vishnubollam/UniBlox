import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as sagemaker from 'aws-cdk-lib/aws-sagemaker';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as crypto from 'crypto';

export class SagemakerStack extends cdk.Stack {
  public readonly endpointName: string;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 1. Create S3 Bucket for Model Artifacts
    const modelBucket = new s3.Bucket(this, 'ModelBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Change to RETAIN for production
      autoDeleteObjects: true, // Remove for production
    });

    // 2. Create IAM Role for SageMaker
    const sageMakerRole = new iam.Role(this, 'SageMakerInvokeRole', {
      assumedBy: new iam.ServicePrincipal('sagemaker.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSageMakerFullAccess'),
      ],
    });

    // 3. Allow SageMaker to Read from S3
    modelBucket.grantRead(sageMakerRole);

    // 4. Upload Model Artifacts Before SageMaker Model Deployment
    const modelDeployment = new s3deploy.BucketDeployment(this, 'DeployModelArtifact', {
      sources: [s3deploy.Source.asset('./local_model_artifacts')], // Ensure this exists!
      destinationBucket: modelBucket,
      destinationKeyPrefix: 'models/',
    });

    // 5. Generate a Valid SageMaker Model Name
    const generateValidModelName = (length: number = 10): string => {
      const randomString = crypto.randomBytes(length).toString('hex').substring(0, length);
      return `model-${randomString}`.substring(0, 63);
    };

    const modelName = generateValidModelName(6);

    // 6. Create SageMaker Model (AFTER Model Upload)
    const model = new sagemaker.CfnModel(this, 'SageMakerModel', {
      modelName: modelName,
      executionRoleArn: sageMakerRole.roleArn,
      primaryContainer: {
        image: '<aws-account-id>.dkr.ecr.us-east-1.amazonaws.com/app-custom-model:test1',//Your image URL
        modelDataUrl: modelBucket.s3UrlForObject('/models/models.tar.gz'), //Your model files stored in s3
      },
    });

    model.node.addDependency(modelDeployment); // Ensures model file is uploaded first

    // 7. Generate a Valid SageMaker Endpoint Name
    const generateRandomEndpointName = (length: number = 10): string => {
      const randomString = crypto.randomBytes(length).toString('hex').substring(0, length);
      return `endpoint-${randomString}`.substring(0, 63);
    };

    const randomEndpointName = generateRandomEndpointName(10);

    // 8. Create SageMaker Endpoint Config
    const endpointConfig = new sagemaker.CfnEndpointConfig(this, 'CustomEndpointConfig', {
      endpointConfigName: randomEndpointName,
      productionVariants: [
        {
          initialInstanceCount: 1,
          instanceType: 'ml.t2.medium',
          variantName: 'AllTraffic',
          modelName: model.modelName!,
        },
      ],
    });

    endpointConfig.node.addDependency(model);

    // 9. Create SageMaker Endpoint
    const endpoint = new sagemaker.CfnEndpoint(this, 'CustomEndpoint', {
      endpointName: randomEndpointName,
      endpointConfigName: randomEndpointName,
    });

    endpoint.node.addDependency(endpointConfig);

    // 10. Export SageMaker Endpoint Name
    this.endpointName = endpoint.attrEndpointName;

    new cdk.CfnOutput(this, 'SageMakerEndpointName', {
      value: this.endpointName,
      exportName: 'SageMakerEndpointName',
    });
  }
}
