import { CfnResource } from "aws-cdk-lib";
import { IConstruct } from "constructs";
import * as fs from "fs";
import { z } from "zod";

const SuppressionSchema = z.record(z.string(), z.object({
    rules_to_suppress: z.array(z.object({
        id: z.string(),
        reason: z.string(),
        error: z.string().optional()
    }))
}))
type SuppressionSchemaType = z.infer<typeof SuppressionSchema>;

export interface NagSuppressionProps {
    path?: string;
    data?: string;
}


export class NagSuppression {
    private readonly suppressions: SuppressionSchemaType;
    public constructor(properties: NagSuppressionProps) {
        if (!properties.path && !properties.data) {
            throw new Error("Either path or data must be provided");
        }
        if (properties.path && properties.data) {
            throw new Error("Only one of path or data can be provided");
        }
        let data: string;
        if (properties.path){
            if (!properties.path.endsWith(".json")){
                throw new Error("Suppression file must be a JSON file");
            }
            if (!fs.existsSync(properties.path)){
                throw new Error("Suppression file does not exist");
            }
            data = fs.readFileSync(properties.path, "utf-8");
        } else if (properties.data){
            data = properties.data;
        } else {
            throw new Error("Either path or data must be provided");
        }
        const parsedData = SuppressionSchema.safeParse(JSON.parse(data));
        if (!parsedData.success){
            throw new Error("Invalid suppression data");
        }
        this.suppressions = parsedData.data;

    }

    public visit(node: IConstruct): void {
        const nodePath = `/${node.node.path}`;
        const suppression = this.suppressions[nodePath];
        if (suppression) {
            (node as CfnResource).addMetadata("cdk_nag", suppression);
            return;
        }
        const matchedRecord = Object.keys(this.suppressions).find((key: string) => {
            try {
                return nodePath.match(key);
            } catch (e) {
                return false;
            }
        })
        if (!matchedRecord) {
            return;
        }
        (node as CfnResource).addMetadata("cdk_nag", this.suppressions[matchedRecord]);
    }
}