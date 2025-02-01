import { AwsSolutionsChecks } from 'cdk-nag';
import {SuppressionSchema, SuppressionSchemaType, WhitelistSchema, WhitelistSchemaType} from "./suppression-interface";
import * as fs from "fs";
import { parse } from "yaml";
import * as path from "path";
import {IConstruct} from "constructs";
import {CfnResource} from "aws-cdk-lib";

export interface CustomAwsSolutionsProps {
    path?: string;
    data?: string;
}

export class CustomAwsSolutions extends AwsSolutionsChecks {
    private readonly suppressions: SuppressionSchemaType;
    private readonly whitelist: WhitelistSchemaType | undefined;

    public constructor(properties: CustomAwsSolutionsProps) {
        super();
        if (!properties.path && !properties.data) {
            throw new Error("Either path or data must be provided");
        }
        if (properties.path && properties.data) {
            throw new Error("Only one of path or data can be provided");
        }
        let data: string;
        if (properties.path){
            data = this.loadDataFromPath(properties.path);
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

        // Load Config
        const whitelistFile = fs.readdirSync(path.join(__dirname, "..", "..")).find(file => {
            return file === "whitelist.json" || file === "whitelist.yml" || file === "whitelist.yaml";
        })
        if (whitelistFile) {
            const whitelistData = this.loadDataFromPath(path.join(__dirname, "..", "..", whitelistFile));
            const parsedWhitelistData = WhitelistSchema.safeParse(JSON.parse(whitelistData));
            if (!parsedWhitelistData.success){
                throw new Error("Unable to load whitelist data from file. Invalid schema");
            }
            this.whitelist = parsedWhitelistData.data;
        }
    }

    private loadDataFromPath(filePath: string): string {
        let data: string;
        if (!filePath.endsWith(".json") && !filePath.endsWith(".yaml") && !filePath.endsWith(".yml")) {
            throw new Error("Suppression file must be a JSON or YAML file");
        }
        if (!fs.existsSync(filePath)){
            throw new Error("Suppression file does not exist");
        }
        if (filePath.endsWith(".json")) {
            data = fs.readFileSync(filePath, "utf-8");
        } else {
            data = JSON.stringify(parse(fs.readFileSync(filePath, "utf-8")));
        }
        return data;
    }


    visit(node: IConstruct) {
        const nodePath = `/${node.node.path}`;
        // Add Whitelist suppression
        if (this.whitelist) {
            if (nodePath !== "/Tree" && nodePath !== "/") {
                if (nodePath.split("/").length === 2 ) {
                    (node as CfnResource).addMetadata("cdk_nag", this.whitelist);
                }
            }
        }
        const suppression = this.suppressions[nodePath];
        if (suppression) {
            (node as CfnResource).addMetadata("cdk_nag", suppression);
        } else {
            const matchedRecord = Object.keys(this.suppressions).find((key: string) => {
                try {
                    return nodePath.match(key);
                } catch (e) {
                    return false;
                }
            })
            if (matchedRecord) {
                (node as CfnResource).addMetadata("cdk_nag", this.suppressions[matchedRecord]);
            }
        }
        super.visit(node);
    }
}