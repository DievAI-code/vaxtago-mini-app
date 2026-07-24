"use client";

import { get2GISMapKey } from "@/lib/env";

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  display_name: string;
  name?: string;
  address?: string;
}


function normalizeQuery(query: string): string {
  return query
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}


// Определяем тип объекта и город
function prepareQuery(query: string) {

  const q = normalizeQuery(query);

  let city = "";

  const cities = [
    "тюмень",
    "москва",
    "санкт-петербург",
    "казань",
    "ташкент",
    "самарканд",
    "алматы",
  ];

  for (const c of cities) {
    if (q.includes(c)) {
      city = c;
      break;
    }
  }


  let object = "";

  if (
    q.includes("вокзал") ||
    q.includes("жд") ||
    q.includes("ж/д") ||
    q.includes("желез")
  ) {
    object = "железнодорожный вокзал";
  }


  if (q.includes("аэропорт")) {
    object = "аэропорт";
  }


  if (object && city) {
    return `${object} ${city}`;
  }


  return q;
}



// Проверка города
function filterByCity(
  results: GeocodingResult[],
  city:string
){

  if(!city) return results;


  return results.filter(item=>{

    const text =
      `${item.display_name} ${item.address}`
      .toLowerCase();


    return text.includes(city.toLowerCase());

  });

}



function sortResults(
 results:GeocodingResult[]
){

 return results.sort((a,b)=>{


 const aText =
 `${a.name} ${a.display_name}`
 .toLowerCase();


 const bText =
 `${b.name} ${b.display_name}`
 .toLowerCase();


 const aScore =
 (aText.includes("вокзал")?10:0)+
 (aText.includes("железнодорож")?10:0);


 const bScore =
 (bText.includes("вокзал")?10:0)+
 (bText.includes("железнодорож")?10:0);


 return bScore-aScore;

 });

}



async function fetch2GISCatalog(
query:string
):Promise<GeocodingResult[]>{


 const key=get2GISMapKey();

 if(!key) return [];


 try{


 const url =
 `https://catalog.api.2gis.com/3.0/items?q=${encodeURIComponent(query)}&key=${key}&fields=items.geometry,items.full_name,items.address_name,items.name&limit=10`;


 console.log("[2GIS QUERY]",query);


 const response=await fetch(url);


 if(!response.ok) return [];


 const data=await response.json();


 const items=data.result?.items || [];


 return items.map((item:any)=>{


 let lat=null;
 let lon=null;


 if(item.point){

 lat=item.point.lat;
 lon=item.point.lon;

 }


 if(lat && lon){

 return {

 latitude:lat,
 longitude:lon,

 display_name:
 item.full_name ||
 item.address_name ||
 item.name,


 name:item.name,


 address:
 item.address_name || ""

 };

 }


 return null;


 }).filter(Boolean);


 }
 catch(e){

 console.error(e);

 return [];

 }

}




export const geocodingService={


 async searchAddress(query:string){


 const original=query;


 const prepared=prepareQuery(query);



 let results=
 await fetch2GISCatalog(prepared);



 console.log(
 "[MAP SEARCH]",
 {
 original,
 prepared,
 count:results.length
 }
 );



 // фильтр города

 const city =
 original
 .toLowerCase()
 .split(" ")
 .find(word=>
 word.length>3 &&
 results.some(r=>
 r.display_name
 .toLowerCase()
 .includes(word)
 )
 );



 if(city){

 results=filterByCity(
 results,
 city
 );

 }



 results=sortResults(results);



 return results;


 },



 async searchAddressFull(query:string){


 if(query.trim().length<2){

 return {
 isTooShort:true,
 results:[],
 error:"Введите адрес"
 };

 }


 const results=
 await this.searchAddress(query);



 return {

 isTooShort:false,

 results,

 error:
 results.length===0
 ?
 "Объект не найден"
 :
 null

 };


 }


};