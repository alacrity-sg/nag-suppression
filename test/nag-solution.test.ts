import { CustomAwsSolutions } from "../lib/nag";
import { IConstruct } from "constructs";
import {Aspects, CfnResource} from "aws-cdk-lib";
import * as cdk from "aws-cdk-lib";
import {Template} from "aws-cdk-lib/assertions";
import {SuppressionSchemaType} from "../lib/nag";

describe('CustomAwsSolutions', () => {
    test("When visiting a node, it should add metadata if the node path is in the suppressions", () => {
        // Arrange
        const suppressionRule = {
            rules_to_suppress: [
                { id: "AwsSolutions-S1", reason: "Test reason" }
            ]
        }
        const suppressionData = JSON.stringify({
            "/MyTestStack/MyFirstBucket/Resource": suppressionRule
        });

        // Act
        const app = new cdk.App();
        Aspects.of(app).add(new CustomAwsSolutions({ data: suppressionData }));
        const stack = new cdk.Stack(app, "MyTestStack");
        new cdk.aws_s3.Bucket(stack, "MyFirstBucket", {
            bucketName: "my-first-bucket",
        });
        const template = Template.fromStack(stack);

        // Assert
        const resource = template.findResources("AWS::S3::Bucket", {
            Properties: {
                BucketName: "my-first-bucket"
            }
        });
        expect(resource).toBeTruthy();
        expect(Object.keys(resource).length).toBe(1);
        Object.keys(resource).forEach((key) => {
            expect(JSON.stringify(resource[key]["Metadata"])).toBe(
                JSON.stringify({cdk_nag: suppressionRule})
            )
        });
    });
    test("When visiting a node, it should add metadata if the node regex is in the suppressions", () => {
        // Arrange
        const suppressionRule = {
            rules_to_suppress: [
                { id: "AwsSolutions-S1", reason: "Test reason" }
            ]
        }
        const suppressionData = JSON.stringify({
            "^/MyTestStack/MyFirst\\w+/Resource$": suppressionRule
        });

        // Act
        const app = new cdk.App();
        Aspects.of(app).add(new CustomAwsSolutions({ data: suppressionData }));
        const stack = new cdk.Stack(app, "MyTestStack");
        new cdk.aws_s3.Bucket(stack, "MyFirstBucket", {
            bucketName: "my-first-bucket",
        });
        const template = Template.fromStack(stack);

        // Assert
        const resource = template.findResources("AWS::S3::Bucket", {
            Properties: {
                BucketName: "my-first-bucket"
            }
        });
        console.log(resource);
        expect(resource).toBeTruthy();
        expect(Object.keys(resource).length).toBe(1);
        Object.keys(resource).forEach((key) => {
            expect(JSON.stringify(resource[key]["Metadata"])).toBe(
                JSON.stringify({cdk_nag: suppressionRule})
            )
        });
    });
});

describe("CustomAwsSolutions.visit", () => {
    const suppressionRule = {
        rules_to_suppress: [
            { id: "AwsSolutions-S1", reason: "Test reason" }
        ]
    }
    test("When visiting a node, it should add metadata if the node path is in the suppressions", () => {
        // Arrange
        const resource = "/MyStack/MyResource"
        const input: SuppressionSchemaType = {};
        input[resource] = suppressionRule;
        const mockedMetadata = jest.fn();
        const mockedNode: IConstruct & CfnResource = {
            node: {
                path: resource
            },
            addMetadata: mockedMetadata
        } as unknown as IConstruct & CfnResource;
        // Act
        const targetClass = new CustomAwsSolutions({ data: JSON.stringify(input)});
        targetClass.visit(mockedNode)
        // Assert
        expect(mockedMetadata).toHaveBeenCalledWith("cdk_nag", suppressionRule);
        expect(mockedMetadata).toHaveBeenCalledTimes(1);
    });
    test("When visiting a node with regex, it should add metadata if the node path matches the regex", () => {
        // Arrange
        const resource = "/MyStack/A0219410123081284AEE/Resource"
        const regexResource = "/MyStack/\\w+/Resource"
        const input: SuppressionSchemaType = {};
        input[regexResource] = suppressionRule;
        const mockedMetadata = jest.fn();
        const mockedNode: IConstruct & CfnResource = {
            node: {
                path: resource
            },
            addMetadata: mockedMetadata
        } as unknown as IConstruct & CfnResource;
        // Act
        const targetClass = new CustomAwsSolutions({ data: JSON.stringify(input)});
        targetClass.visit(mockedNode)
        // Assert
        expect(mockedMetadata).toHaveBeenCalledWith("cdk_nag", suppressionRule);
        expect(mockedMetadata).toHaveBeenCalledTimes(1);
    });
})