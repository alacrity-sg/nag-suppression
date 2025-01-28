#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { PocNagStack } from '../lib/poc-nag-stack';
import { NagSuppression } from '../lib/nag/suppression';
import { Aspects } from 'aws-cdk-lib';
import { AwsSolutionsChecks } from 'cdk-nag';
import { resolve } from 'path';

const app = new cdk.App();
new PocNagStack(app, 'PocNagStack', {});
Aspects.of(app).add(new NagSuppression({ path: resolve(__dirname, '../bin/nag-suppression.json')}));
Aspects.of(app).add(new AwsSolutionsChecks());