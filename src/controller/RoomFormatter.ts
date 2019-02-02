import {IData} from "./Data";
import * as parse5 from "parse5";
import {InsightDatasetKind} from "./IInsightFacade";
import * as http from "http";
import {DataEntry} from "./DataEnrty";
interface IRoomDat {
    fname: string;
    sname: string;
    number: string;
    name: string;
    addr: string;
    lat: number;
    lon: number;
    seats: number;
    type: string;
    furn: string;
    href: string;
}
interface IClass {
    number: string;
    name: string;
    seats: number;
    type: string;
    furn: string;
    href: string;
}
export class RoomFormatter {
    public static async formatRoomString(dtsID: string, HTMLString: string,
                                         kind: InsightDatasetKind, dataEntries: DataEntry[]): Promise<IData> {
           let that = this;
           let full: string = "";
           let short: string = "";
           let ad: string = "";
           let lt: number = 0;
           let ln: number = 0;
           let building: IRoomDat[] = [];
           let classes: IClass[] = [];
           let n: number = 0;
           return new Promise<IData>(async function (resolve) {
           try {
           let HTMLObj: any = parse5.parse(HTMLString);
           let obj: any = Object.keys(HTMLObj);
           if (obj.includes("childNodes")) {
                let child =  HTMLObj["childNodes"];
                for (let ch of child) {
                    if (ch["nodeName"] === "html") {
                        if (Object.keys(ch).includes("childNodes")) {
                            let newChild = ch["childNodes"];
                            for (let nch of newChild) {
                                if (nch["nodeName"] === "body" && Object.keys(nch)
                                    .includes("childNodes")) {
                                    let xChild = nch["childNodes"];
                                    for (let xch of xChild) {
                                        if (xch["nodeName"] === "div"
                                            && Object.keys(xch).includes("childNodes")) {
                                            let aChild = xch["childNodes"];
                                            for (let ach of aChild) {
                                                if (ach["nodeName"] === "div"
                                                && Object.keys(ach).includes("childNodes")) {
                                                    let bChild = ach["childNodes"];
                                                    for (let bch of bChild) {
                                                        if (bch["nodeName"] === "div"
                                                        && Object.keys(bch).includes("childNodes")) {
                                                            let cChild = bch["childNodes"];
                                                            for (let cch of cChild) {
                                                                if (cch["nodeName"] === "section"
                                                                && Object.keys(cch)
                                                                        .includes("childNodes")) {
                                                                    let dChild = cch["childNodes"];
                                                                    for (let dch of dChild) {
                                                                        if (dch["nodeName"] === "div"
                                                                        && Object.keys(dch)
                                                                                .includes("childNodes")) {
                                                                            let eChild = dch["childNodes"];
                                                                            for (let ech of eChild) {
                                                                                if (ech["nodeName"] === "div"
                                                                                    && ech["attrs"][0]["value"]
                                                                                    === "view-content"
                                                                                && Object.keys(ech)
                                                                                        .includes
                                                                                        ("childNodes")) {
                                                                                    let fChild = ech["childNodes"];
                                                                                    for (let fch of fChild) {
                                                                                        if (fch["nodeName"] === "div"
                                                                                        && Object.keys(fch)
                                                                                                .includes
                                                                                                ("childNodes")) {
                                                                                            let gChild =
                                                                                                fch["childNodes"];
                                                                                            for (let gch of gChild) {
                                                                                                if (gch["nodeName"]
                                                                                                === "div"
                                                                                                && Object.keys(gch)
                                                                            .includes("childNodes")) {
                                                                               let hChild = gch["childNodes"];
                                                                               for (let hch of hChild) {
                                                                     if (hch["nodeName"] === "div"
                                                                         && Object.keys(hch)
                                                                             .includes("childNodes")) {
                                                                         let iChild = hch["childNodes"];
                                                                         for (let ich of iChild) {
                                                                             if (ich["nodeName"] === "h2"
                                                        && Object.keys(ich).includes("childNodes")) {
                                                                                 let jChild = ich["childNodes"];
                                                                                 for (let jch of jChild) {
                                                            if (jch["nodeName"] === "span"
                                                            && Object.keys(jch).includes("childNodes")) {
                                                                let kChild = jch["childNodes"];
                                                                for (let kch of kChild) {
                                                                    if (kch["nodeName"] === "#text") {
                                                                        full = kch["value"];
                                                                        if (full.length === 0) {
                                                                            const at: IData = {num: 0,
                                                                                dts: dataEntries};
                                                                            resolve (at);
                                                                        }
                                                                        break;
                                                                    }
                                                                }
                                                            }
                                                        }
                                                                             }
                                                                             if (ich["nodeName"] === "div"
                                                         && Object.keys(ich).includes("attrs")
                                                         && Object.keys(ich).includes("childNodes")) {
                                                                                 let b = ich["attrs"];
                                                                                 if (b[0]["value"]
                                                                                     === "building-field") {
                                                                                     let lChild = ich["childNodes"];
                                                                                     for (let lch of lChild) {
                                                                                         if (lch["nodeName"] === "div"
                                                          && Object.keys(lch).includes("childNodes")) {
                                                           let mChild = lch["childNodes"];
                                                           for (let mch of mChild) {
                                                               if (mch["nodeName"] === "#text") {
                                                                   if (n === 0) {
                                                                    ad = mch["value"];
                                                                    if (ad.length === 0) {
                                                                        const bt: IData = {num: 0, dts: dataEntries};
                                                                        resolve(bt);
                                                                       }
                                                                    n++;
                                                                    break;
                                                                   }
                                                               }
                                                           }
                                                                                         }
                                                                                     }
                                                                                 }
                                                                             }
                                                                         }
                                                                     }
                                                                 }
                                                                                                }
                                                                                            }
                                                                                        }
                                                                                    }
                                                                                }
                                                                                if (ech["nodeName"] === "div"
                                                 && ech["attrs"][0]["value"] === "view-footer"
                                                 && Object.keys(ech).includes("childNodes")) {
                                                 let fChild = ech["childNodes"];
                                                 for (let fch of fChild) {
                                                     if (fch["nodeName"] === "div"
                                                         && Object.keys(fch).includes("childNodes")) {
                                                         let gChild = fch["childNodes"];
                                                         for (let gch of gChild) {
                                                             if (gch["nodeName"] === "div"
                                                             && Object.keys(gch).includes("childNodes")) {
                                                                 let hChild = gch["childNodes"];
                                                                 for (let hch of hChild) {
                                                                     if (hch["nodeName"] === "table"
                                                             && Object.keys(hch).includes("childNodes")) {
                                                                         let iChild = hch["childNodes"];
                                                                         for (let ich of iChild) {
                                                                             if (ich["nodeName"] === "tbody"
                                                             && Object.keys(ich).includes("childNodes")) {
                                                                                 let jChild = ich["childNodes"];
                                                                                 for (let jch of jChild) {
                                                                                     if (jch["nodeName"] === "tr"
                                                             && Object.keys(jch).includes("childNodes")) {
                                                                                         let hreF: string = "";
                                                                                         let num: string = "";
                                                                                         let cap: number = 0;
                                                                                         let furN: string = "";
                                                                                         let typE: string = "";
                                                                                         let kChild = jch["childNodes"];
                                                                                         for (let kch of kChild) {
                                                                  if (kch["nodeName"] === "td"
                                                                  && Object.keys(kch).includes("childNodes")) {
                                                                      if (kch["attrs"][0]["value"]
                                                              === "views-field views-field-field-room-number") {
                                                                      let lChild = kch["childNodes"];
                                                                      for (let lch of lChild) {
                                                                          if (lch["nodeName"] === "a"
                                                                          && lch["attrs"][0]["name"] === "href") {
                                                                              hreF = lch["attrs"][0]["value"];
                                                                              let room = hreF.split("/room/")[1];
                                                                              if (n === 1) {
                                                                               short = room.split("-")[0];
                                                                              }
                                                                              n++;
                                                                              num = room.split("-")[1];
                                                                          }
                                                                      }
                                                                  }
                                                                      if (kch["attrs"][0]["value"]
                                                              === "views-field views-field-field-room-capacity") {
                                let lChild = kch["childNodes"];
                                for (let lch of lChild) {
                                if (lch["nodeName"] === "#text") {
                                    cap = Number(lch["value"].trim());
                                }
                            } }
                                                                      if (kch["attrs"][0]["value"]
                                === "views-field views-field-field-room-furniture") {
                                                                          let lChild = kch["childNodes"];
                                                                          for (let lch of lChild) {
                                                                          if (lch["nodeName"] === "#text") {
                                    furN = lch["value"].trim();
                                } }
                                                                      }
                                                                      if (kch["attrs"][0] ["value"]
                                                                      === "views-field views-field-field-room-type") {
                                                                          let lChild = kch["childNodes"];
                                                                          for (let lch of lChild) {
                                                                          if (lch["nodeName"] === "#text") {
                                                                     typE = lch["value"].trim();
                                                                          }
                                                                      } }
                                                                  }
                                                                                             }
                                                                                         if (cap !== 0) {
                                                                             const rm: IClass = {number: num,
                                                                             name: short + "_" + String(num),
                                                                             seats: cap, type: typE, furn: furN,
                                                                                                 href: hreF };
                                                                             classes.push(rm);
                                                              }
                                                                                     }
                                                                                 }
                                                                                 n = 1;
                                                                             }
                                                                         }
                                                                     }
                                                                 }
                                                             }
                                                         }
                                                     }
                                                 }
                                                                                }
                                                                            }
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
           if (classes.length > 0) {
              await that.getGeo(ad).then(  (Geo: number[]) => {
                   lt = Geo[0];
                   ln = Geo[1];
               }).catch((err: IData) => {
                   err = {num: 0, dts: dataEntries};
                   resolve(err);
               });
              for (let i of classes) {
                       const bd: IRoomDat = {fname: full, sname: short, number: i.number, name: i.name, addr: ad,
                           lat: lt,
                           lon: ln, seats: i.seats, type: i.type, furn: i.furn, href: i.href};
                       building.push(bd);
                  }
              const jsbuild: string = JSON.parse(JSON.stringify(building));
              const dataEntry = new DataEntry(dtsID, kind, jsbuild);
              if (dataEntries.includes(dataEntry)) {
                  const ct: IData = {num: 0, dts: dataEntries};
                  resolve(ct);
                   } else {
                        dataEntries.push(dataEntry);
                        const et: IData = {num: classes.length, dts: dataEntries};
                        resolve(et);
               } }
           const dt: IData = {num: 0, dts: dataEntries};
           resolve(dt);
    } catch (error) {
               const dt: IData = {num: 0, dts: dataEntries};
               resolve(dt); } });
    }
    public static getGeo(address: string): Promise<number[]> {
            const addr: string = address.replace(/ /g, "%20");
            let response: number[] = [];
            return new Promise<number[]>(function (resolve, reject) {
            http.get("http://cs310.ugrad.cs.ubc.ca:11316/api/v1/project_j0k0b_u2e0b/" + addr,
                    (res: any) => {
                        if (res.statusCode === 404) {
                            res.resume();
                            return reject([0, 0]);
                        }
                        if (res.statusCode === 200 && res.headers["content-type"] === "application/json") {
                            res.setEncoding("utf8");
                            let data: string = "";
                            res.on("data", (chnk: string) => data += chnk);
                            res.on("error", () => {
                                return reject([0, 0]);
                            });
                            res.on("end", () => {
                                    let dat = JSON.parse(data);
                                    if (Object.keys(dat).includes("error")) {
                                       return reject([0, 0]);
                                    }
                                    response.push(dat["lat"]);
                                    response.push(dat["lon"]);
                                    resolve(response);
                                    return resolve;
                            });
                        }
                    }
                ).on("error", (err: any) => {
                    err = [0, 0];
                    return reject(err);
            });
                });
    }
    public static recurseHTML(doc: any, roomnames: string[]): string[] {
        let that = this;
        const obj = Object.keys(doc);
        let table: any = {};
        let body: any = {};
        if (obj.includes("childNodes")) {
            let nodes = doc["childNodes"];
            for (let n of nodes) {
                that.recurseHTML(n, roomnames);
            }
        }
        if (obj.includes("nodeName")) {
            if (doc["nodeName"] === "div") {
                if (obj.includes("attrs")) {
                    let current = doc["attrs"];
                    for (let each of current) {
                        if (each["name"] === "class") {
                            if (each["value"] === "view-content") {
                                if (obj.includes("childNodes")) {
                                    for (let node of doc["childNodes"]) {
                                        if (Object.keys(node).includes("nodeName")) {
                                            if (node["nodeName"] === "table") {
                                                table = node;
                                                break;
                                            }
                                        }
                                    }
                                    let newObj = Object.keys(table);
                                    if (newObj.length > 0) {
                                        if (newObj.includes("childNodes")) {
                                            for (let node of table["childNodes"]) {
                                                if (Object.keys(node).includes("nodeName")) {
                                                    if (node["nodeName"] === "tbody") {
                                                        body = node;
                                                        break;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    let xObj = Object.keys(body);
                                    if (xObj.length > 0) {
                                        if (xObj.includes("childNodes")) {
                                            for (let node of body["childNodes"]) {
                                                if (Object.keys(node).includes("nodeName") &&
                                                    node["nodeName"] === "tr") {
                                                    let value = node;
                                                    let keys = Object.keys(value);
                                                    if (keys.includes("childNodes")) {
                                                        for (let xnode of value["childNodes"]) {
                                                            let child = Object.keys(xnode);
                                                            for (let ynode of child) {
                                                                let cValue = ynode;
                                                                if (cValue.includes("nodeName") &&
                                                                    xnode["nodeName"] === "td") {
                                                                    let newChild = Object.keys(xnode);
                                                                    if (newChild.includes("childNodes")) {
                                                                        let xChild = xnode["childNodes"];
                                                                        for (let x of xChild) {
                                                                            let xKeys = Object.keys(x);
                                                                            if (xKeys.includes
                                                                                ("nodeName") &&
                                                                                xKeys.includes("attrs") &&
                                                                                x["nodeName"]
                                                                                === "a") {
                                                                                let xyz = x["attrs"];
                                                                                for (let attr of xyz) {
                                                                                    if (!roomnames
                                                                                            .includes(attr["value"])
                                                                                        && attr["name"] === "href") {
                                                                                        roomnames.push
                                                                                        (attr["value"]);
                                                                                        break;
                                                                                    }
                                                                                }
                                                                            }
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        return roomnames;
    }
}
