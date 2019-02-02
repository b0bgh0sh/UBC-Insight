import {InsightDatasetKind} from "./IInsightFacade";
import {DataEntry} from "./DataEnrty";
import {IData} from "./Data";

export class CourseFormatter {
    private static formatSection(JSObjt: any) {
        for (let object of JSObjt.result) {
            delete object.Campus;
            delete object.Detail;
            delete object.Enrolled;
            delete object.High;
            delete object.Low;
            delete object.Other;
            delete object.Stddev;
            delete object.Session;
            delete object.Withdrew;
            delete object.tier_eighty;
            delete object.tier_eighty_five;
            delete object.tier_fifty;
            delete object.tier_fifty_five;
            delete object.tier_forty;
            delete object.tier_g_fifty;
            delete object.tier_ninety;
            delete object.tier_seventy_six;
            delete object.tier_seventy_two;
            delete object.tier_sixty;
            delete object.tier_sixty_eight;
            delete object.tier_sixty_four;
            delete object.tier_ten;
            delete object.tier_thirty;
            delete object.tier_twenty;
            delete object.tier_zero;
        }
    }
    public static formatCourseString(dtsID: string,
                                     JSONString: string, kind: InsightDatasetKind, dataEntries: DataEntry[]): IData {
        let that = this;
        try {
            if (JSONString.length > 0) {
                let JSObjt = JSON.parse(JSONString);
                // what's considered valid for Section?
                // array of sections of a single course
                //  let sections: RQCKey[] = [];
                if (JSObjt.result.length !== 0) {
                    // http://wiki.analytica.com/Object_Manipulation_Typescript_Commands
                    // delete unused fields
                    that.formatSection(JSObjt);
                    const dataEntry = new DataEntry(dtsID, kind, JSObjt.result);
                    if (dataEntries.includes(dataEntry)) {
                        const dt: IData = {num: 0, dts: dataEntries};
                        return dt;
                    } else {
                        dataEntries.push(dataEntry);
                        const dt: IData = {num: JSObjt.result.length, dts: dataEntries};
                        return dt;
                    }
                } else {
                    const dt: IData = {num: 0, dts: dataEntries};
                    return dt;
                }
            } else {
                const dt: IData = {num: 0, dts: dataEntries};
                return dt;
            }
        } catch (error) {
            const dt: IData = {num: 0, dts: dataEntries};
            return dt;
        }
    }

}
