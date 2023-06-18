import { load } from "https://deno.land/std@0.192.0/dotenv/mod.ts";
import { pLimit } from "https://deno.land/x/p_limit@v1.0.0/mod.ts";

const env = await load();

type TraccarData = {
  id: number;
  deviceId: number;
  protocol: string;
  deviceTime: string;
  fixTime: string;
  serverTime: string;
  outdated: boolean;
  valid: boolean;
  latitude: number;
  longitude: number;
  altitude: number;
  speed: number;
  course: number;
  address: string;
  accuracy: number;
  network: unknown;
  geofenceIds: number[];
  attributes: {
    "batteryLevel": 67.0;
    "distance": 82.35;
    "totalDistance": 194910.67;
    "motion": false;
  };
}[];

const traccarRes = await fetch(
  `${env.TRACCAR_URL}/api/positions?deviceId=${env.TRACCAR_DEVICE_ID}&from=1963-11-22T18:30:00Z&to=2100-11-22T18:30:00Z`,
  {
    headers: {
      "Authorization": `Basic ${
        btoa(env.TRACCAR_USER + ":" + env.TRACCAR_PASSWORD)
      }`,
    },
  },
);
const traccarData: TraccarData = await traccarRes.json();

console.log(traccarData.length);

let count = 0;

console.log(
  JSON.stringify({
    "_type": "location",
    "acc": traccarData[0].accuracy,
    "alt": traccarData[0].altitude,
    "batt": traccarData[0].attributes.batteryLevel,
    "bs": 0,
    // "conn": "w",
    "created_at": traccarData[0].deviceTime,
    "lat": traccarData[0].latitude,
    "lon": traccarData[0].longitude,
    // "m": 0,
    // "t": "u",
    // "tid": "nz",
    "topic": `owntracks/${env.OWNTRACKS_USER}/${env.OWNTRACKS_DEVICE}`,
    "tst": traccarData[0].fixTime,
    // "vac": traccarData[0].v,
    "vel": traccarData[0].speed,
    "tid": env.OWNTRACKS_DEVICE.slice(-2),
  }),
);

const limit = pLimit(20);
const promises = [];
for (const data of traccarData) {
  promises.push(limit(async () => {
    await fetch(
      `${env.OWNTRACKS_URL}/pub?u=${env.OWNTRACKS_USER}&d=${env.OWNTRACKS_DEVICE}`,
      {
        method: "POST",
        body: JSON.stringify({
          "_type": "location",
          "acc": data.accuracy,
          "alt": data.altitude,
          "batt": data.attributes.batteryLevel,
          "bs": 0,
          // "conn": "w",
          "created_at": data.deviceTime,
          "lat": data.latitude,
          "lon": data.longitude,
          // "m": 0,
          "t": "u",
          // "tid": "nz",
          "topic": `owntracks/${env.OWNTRACKS_USER}/${env.OWNTRACKS_DEVICE}`,
          "tst": data.fixTime,
          // "vac": data.v,
          "vel": data.speed,
          "tid": env.OWNTRACKS_DEVICE.slice(-2),
        }),
      },
    );
    count++;
    console.log(count);
  }));
}
await Promise.all(promises);
