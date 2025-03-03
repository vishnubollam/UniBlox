"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SagemakerStack = void 0;
const cdk = require("aws-cdk-lib");
const s3 = require("aws-cdk-lib/aws-s3");
const s3deploy = require("aws-cdk-lib/aws-s3-deployment");
const sagemaker = require("aws-cdk-lib/aws-sagemaker");
const iam = require("aws-cdk-lib/aws-iam");
const crypto = require("crypto");
class SagemakerStack extends cdk.Stack {
    constructor(scope, id, props) {
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
        const generateValidModelName = (length = 10) => {
            const randomString = crypto.randomBytes(length).toString('hex').substring(0, length);
            return `model-${randomString}`.substring(0, 63);
        };
        const modelName = generateValidModelName(6);
        // 6. Create SageMaker Model (AFTER Model Upload)
        const model = new sagemaker.CfnModel(this, 'SageMakerModel', {
            modelName: modelName,
            executionRoleArn: sageMakerRole.roleArn,
            primaryContainer: {
                image: '640168432766.dkr.ecr.us-east-1.amazonaws.com/app-custom-model:test1', //640168432766.dkr.ecr.us-east-1.amazonaws.com/app-custom-model:latest
                modelDataUrl: modelBucket.s3UrlForObject('/models/models.tar.gz'),
            },
        });
        model.node.addDependency(modelDeployment); // Ensures model file is uploaded first
        // 7. Generate a Valid SageMaker Endpoint Name
        const generateRandomEndpointName = (length = 10) => {
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
                    modelName: model.modelName,
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
exports.SagemakerStack = SagemakerStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2FnZW1ha2VyU3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzYWdlbWFrZXJTdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxtQ0FBbUM7QUFDbkMseUNBQXlDO0FBQ3pDLDBEQUEwRDtBQUMxRCx1REFBdUQ7QUFDdkQsMkNBQTJDO0FBRTNDLGlDQUFpQztBQUVqQyxNQUFhLGNBQWUsU0FBUSxHQUFHLENBQUMsS0FBSztJQUczQyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQXNCO1FBQzlELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLDBDQUEwQztRQUMxQyxNQUFNLFdBQVcsR0FBRyxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLGFBQWEsRUFBRTtZQUNyRCxhQUFhLEVBQUUsR0FBRyxDQUFDLGFBQWEsQ0FBQyxPQUFPLEVBQUUsa0NBQWtDO1lBQzVFLGlCQUFpQixFQUFFLElBQUksRUFBRSx3QkFBd0I7U0FDbEQsQ0FBQyxDQUFDO1FBRUgsbUNBQW1DO1FBQ25DLE1BQU0sYUFBYSxHQUFHLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUscUJBQXFCLEVBQUU7WUFDOUQsU0FBUyxFQUFFLElBQUksR0FBRyxDQUFDLGdCQUFnQixDQUFDLHlCQUF5QixDQUFDO1lBQzlELGVBQWUsRUFBRTtnQkFDZixHQUFHLENBQUMsYUFBYSxDQUFDLHdCQUF3QixDQUFDLDJCQUEyQixDQUFDO2FBQ3hFO1NBQ0YsQ0FBQyxDQUFDO1FBRUgscUNBQXFDO1FBQ3JDLFdBQVcsQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDLENBQUM7UUFFckMsOERBQThEO1FBQzlELE1BQU0sZUFBZSxHQUFHLElBQUksUUFBUSxDQUFDLGdCQUFnQixDQUFDLElBQUksRUFBRSxxQkFBcUIsRUFBRTtZQUNqRixPQUFPLEVBQUUsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLEtB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LWxpYic7XG5pbXBvcnQgKiBhcyBzMyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtczMnO1xuaW1wb3J0ICogYXMgczNkZXBsb3kgZnJvbSAnYXdzLWNkay1saWIvYXdzLXMzLWRlcGxveW1lbnQnO1xuaW1wb3J0ICogYXMgc2FnZW1ha2VyIGZyb20gJ2F3cy1jZGstbGliL2F3cy1zYWdlbWFrZXInO1xuaW1wb3J0ICogYXMgaWFtIGZyb20gJ2F3cy1jZGstbGliL2F3cy1pYW0nO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5pbXBvcnQgKiBhcyBjcnlwdG8gZnJvbSAnY3J5cHRvJztcblxuZXhwb3J0IGNsYXNzIFNhZ2VtYWtlclN0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcbiAgcHVibGljIHJlYWRvbmx5IGVuZHBvaW50TmFtZTogc3RyaW5nO1xuXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzPzogY2RrLlN0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgIC8vIDEuIENyZWF0ZSBTMyBCdWNrZXQgZm9yIE1vZGVsIEFydGlmYWN0c1xuICAgIGNvbnN0IG1vZGVsQnVja2V0ID0gbmV3IHMzLkJ1Y2tldCh0aGlzLCAnTW9kZWxCdWNrZXQnLCB7XG4gICAgICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLCAvLyBDaGFuZ2UgdG8gUkVUQUlOIGZvciBwcm9kdWN0aW9uXG4gICAgICBhdXRvRGVsZXRlT2JqZWN0czogdHJ1ZSwgLy8gUmVtb3ZlIGZvciBwcm9kdWN0aW9uXG4gICAgfSk7XG5cbiAgICAvLyAyLiBDcmVhdGUgSUFNIFJvbGUgZm9yIFNhZ2VNYWtlclxuICAgIGNvbnN0IHNhZ2VNYWtlclJvbGUgPSBuZXcgaWFtLlJvbGUodGhpcywgJ1NhZ2VNYWtlckludm9rZVJvbGUnLCB7XG4gICAgICBhc3N1bWVkQnk6IG5ldyBpYW0uU2VydmljZVByaW5jaXBhbCgnc2FnZW1ha2VyLmFtYXpvbmF3cy5jb20nKSxcbiAgICAgIG1hbmFnZWRQb2xpY2llczogW1xuICAgICAgICBpYW0uTWFuYWdlZFBvbGljeS5mcm9tQXdzTWFuYWdlZFBvbGljeU5hbWUoJ0FtYXpvblNhZ2VNYWtlckZ1bGxBY2Nlc3MnKSxcbiAgICAgIF0sXG4gICAgfSk7XG5cbiAgICAvLyAzLiBBbGxvdyBTYWdlTWFrZXIgdG8gUmVhZCBmcm9tIFMzXG4gICAgbW9kZWxCdWNrZXQuZ3JhbnRSZWFkKHNhZ2VNYWtlclJvbGUpO1xuXG4gICAgLy8gNC4gVXBsb2FkIE1vZGVsIEFydGlmYWN0cyBCZWZvcmUgU2FnZU1ha2VyIE1vZGVsIERlcGxveW1lbnRcbiAgICBjb25zdCBtb2RlbERlcGxveW1lbnQgPSBuZXcgczNkZXBsb3kuQnVja2V0RGVwbG95bWVudCh0aGlzLCAnRGVwbG95TW9kZWxBcnRpZmFjdCcsIHtcbiAgICAgIHNvdXJjZXM6IFtzM2RlcGxveS5Tb3VyY2UuYXNzZXQoJy4vbG9jYWxfbW9kZWxfYXJ0aWZhY3RzJyldLCAvLyBFbnN1cmUgdGhpcyBleGlzdHMhXG4gICAgICBkZXN0aW5hdGlvbkJ1Y2tldDogbW9kZWxCdWNrZXQsXG4gICAgICBkZXN0aW5hdGlvbktleVByZWZpeDogJ21vZGVscy8nLFxuICAgIH0pO1xuXG4gICAgLy8gNS4gR2VuZXJhdGUgYSBWYWxpZCBTYWdlTWFrZXIgTW9kZWwgTmFtZVxuICAgIGNvbnN0IGdlbmVyYXRlVmFsaWRNb2RlbE5hbWUgPSAobGVuZ3RoOiBudW1iZXIgPSAxMCk6IHN0cmluZyA9PiB7XG4gICAgICBjb25zdCByYW5kb21TdHJpbmcgPSBjcnlwdG8ucmFuZG9tQnl0ZXMobGVuZ3RoKS50b1N0cmluZygnaGV4Jykuc3Vic3RyaW5nKDAsIGxlbmd0aCk7XG4gICAgICByZXR1cm4gYG1vZGVsLSR7cmFuZG9tU3RyaW5nfWAuc3Vic3RyaW5nKDAsIDYzKTtcbiAgICB9O1xuXG4gICAgY29uc3QgbW9kZWxOYW1lID0gZ2VuZXJhdGVWYWxpZE1vZGVsTmFtZSg2KTtcblxuICAgIC8vIDYuIENyZWF0ZSBTYWdlTWFrZXIgTW9kZWwgKEFGVEVSIE1vZGVsIFVwbG9hZClcbiAgICBjb25zdCBtb2RlbCA9IG5ldyBzYWdlbWFrZXIuQ2ZuTW9kZWwodGhpcywgJ1NhZ2VNYWtlck1vZGVsJywge1xuICAgICAgbW9kZWxOYW1lOiBtb2RlbE5hbWUsXG4gICAgICBleGVjdXRpb25Sb2xlQXJuOiBzYWdlTWFrZXJSb2xlLnJvbGVBcm4sXG4gICAgICBwcmltYXJ5Q29udGFpbmVyOiB7XG4gICAgICAgIGltYWdlOiAnNjQwMTY4NDMyNzY2LmRrci5lY3IudXMtZWFzdC0xLmFtYXpvbmF3cy5jb20vYXBwLWN1c3RvbS1tb2RlbDp0ZXN0MScsLy82NDAxNjg0MzI3NjYuZGtyLmVjci51cy1lYXN0LTEuYW1hem9uYXdzLmNvbS9hcHAtY3VzdG9tLW1vZGVsOmxhdGVzdFxuICAgICAgICBtb2RlbERhdGFVcmw6IG1vZGVsQnVja2V0LnMzVXJsRm9yT2JqZWN0KCcvbW9kZWxzL21vZGVscy50YXIuZ3onKSxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICBtb2RlbC5ub2RlLmFkZERlcGVuZGVuY3kobW9kZWxEZXBsb3ltZW50KTsgLy8gRW5zdXJlcyBtb2RlbCBmaWxlIGlzIHVwbG9hZGVkIGZpcnN0XG5cbiAgICAvLyA3LiBHZW5lcmF0ZSBhIFZhbGlkIFNhZ2VNYWtlciBFbmRwb2ludCBOYW1lXG4gICAgY29uc3QgZ2VuZXJhdGVSYW5kb21FbmRwb2ludE5hbWUgPSAobGVuZ3RoOiBudW1iZXIgPSAxMCk6IHN0cmluZyA9PiB7XG4gICAgICBjb25zdCByYW5kb21TdHJpbmcgPSBjcnlwdG8ucmFuZG9tQnl0ZXMobGVuZ3RoKS50b1N0cmluZygnaGV4Jykuc3Vic3RyaW5nKDAsIGxlbmd0aCk7XG4gICAgICByZXR1cm4gYGVuZHBvaW50LSR7cmFuZG9tU3RyaW5nfWAuc3Vic3RyaW5nKDAsIDYzKTtcbiAgICB9O1xuXG4gICAgY29uc3QgcmFuZG9tRW5kcG9pbnROYW1lID0gZ2VuZXJhdGVSYW5kb21FbmRwb2ludE5hbWUoMTApO1xuXG4gICAgLy8gOC4gQ3JlYXRlIFNhZ2VNYWtlciBFbmRwb2ludCBDb25maWdcbiAgICBjb25zdCBlbmRwb2ludENvbmZpZyA9IG5ldyBzYWdlbWFrZXIuQ2ZuRW5kcG9pbnRDb25maWcodGhpcywgJ0N1c3RvbUVuZHBvaW50Q29uZmlnJywge1xuICAgICAgZW5kcG9pbnRDb25maWdOYW1lOiByYW5kb21FbmRwb2ludE5hbWUsXG4gICAgICBwcm9kdWN0aW9uVmFyaWFudHM6IFtcbiAgICAgICAge1xuICAgICAgICAgIGluaXRpYWxJbnN0YW5jZUNvdW50OiAxLFxuICAgICAgICAgIGluc3RhbmNlVHlwZTogJ21sLnQyLm1lZGl1bScsXG4gICAgICAgICAgdmFyaWFudE5hbWU6ICdBbGxUcmFmZmljJyxcbiAgICAgICAgICBtb2RlbE5hbWU6IG1vZGVsLm1vZGVsTmFtZSEsXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH0pO1xuXG4gICAgZW5kcG9pbnRDb25maWcubm9kZS5hZGREZXBlbmRlbmN5KG1vZGVsKTtcblxuICAgIC8vIDkuIENyZWF0ZSBTYWdlTWFrZXIgRW5kcG9pbnRcbiAgICBjb25zdCBlbmRwb2ludCA9IG5ldyBzYWdlbWFrZXIuQ2ZuRW5kcG9pbnQodGhpcywgJ0N1c3RvbUVuZHBvaW50Jywge1xuICAgICAgZW5kcG9pbnROYW1lOiByYW5kb21FbmRwb2ludE5hbWUsXG4gICAgICBlbmRwb2ludENvbmZpZ05hbWU6IHJhbmRvbUVuZHBvaW50TmFtZSxcbiAgICB9KTtcblxuICAgIGVuZHBvaW50Lm5vZGUuYWRkRGVwZW5kZW5jeShlbmRwb2ludENvbmZpZyk7XG5cbiAgICAvLyAxMC4gRXhwb3J0IFNhZ2VNYWtlciBFbmRwb2ludCBOYW1lXG4gICAgdGhpcy5lbmRwb2ludE5hbWUgPSBlbmRwb2ludC5hdHRyRW5kcG9pbnROYW1lO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ1NhZ2VNYWtlckVuZHBvaW50TmFtZScsIHtcbiAgICAgIHZhbHVlOiB0aGlzLmVuZHBvaW50TmFtZSxcbiAgICAgIGV4cG9ydE5hbWU6ICdTYWdlTWFrZXJFbmRwb2ludE5hbWUnLFxuICAgIH0pO1xuICB9XG59XG4iXX0=