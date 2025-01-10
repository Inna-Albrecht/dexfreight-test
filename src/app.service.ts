
import { HttpStatus, Injectable, Req, Res } from '@nestjs/common';
import { response } from 'express';
import { PrismaService } from './prisma.service';
import { BidStatus, LoadStatus } from '@prisma/client';
const validLoad = (obj: any) => {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof obj.userName === "string" &&
    typeof obj.email === "string" &&
    typeof obj.rate === "number" &&
    typeof obj.instructions === "string" &&
    typeof obj.status === "string" &&
    obj.pointA &&
    typeof obj.pointA.addressA === "string" &&
    typeof obj.pointA.lat === "number" &&
    typeof obj.pointA.lng === "number" &&
    obj.pointB &&
    typeof obj.pointB.addressB === "string" &&
    typeof obj.pointB.lat === "number" &&
    typeof obj.pointB.lng === "number"
  );
};

@Injectable()
export class AppService {
  constructor(private prisma: PrismaService) { }

  getHello(): string {
    return 'Hello World!';
  }

  async createLoad(datum) {
    console.log('%csrc/app.service.ts:15 datum', 'color: #007acc;', datum);
    if (!validLoad(datum)) {
      return { error: 400, message: 'invalid load object', data: datum }
    }
    try {
      const insert = await this.prisma.load.create({
        data: {
          pointA: {
            create: {
              address: datum.pointA.addressA,
              latitude: datum.pointA.lat,
              longitude: datum.pointA.lng
            }
          },
          pointB: {
            create: {
              address: datum.pointB.addressB,
              latitude: datum.pointB.lat,
              longitude: datum.pointB.lng
            }
          },
          userName: datum.userName,
          email: datum.email,
          rate: datum.rate,
          instructions: datum.instructions,
          status: LoadStatus.Open,
          distance: dist
        }
      })
      console.log(insert)
      return insert

    } catch (error) {
      console.error("Error creating load:", error);
      return {
        error: 500,
        message: "An error occurred while creating the load",
      };
    }
  }

  async updateLoad(where, datum) {

    try {
      const check = await this.sanityCheckLoadIsNotClosed(where)
      if(check){
        return {
          error: 400,
          message: "Load closed cannot modify",
        };
      }
      const conditions: any = {};  
      for (const [key, value] of Object.entries(datum)) {
        if (value) { 
          conditions[key] = value; 
        }
      }
      console.log(conditions)
     const update = await this.prisma.load.update({
      data: conditions, where: {
        id: where
      }
     })
     return update
    } catch (error) {
      console.error("Error creating load:", error);
      return {
        error: 500,
        message: "An error occurred while updating the load",
      };
    }
    
  }

  async getLoad(id) {
    try {
      const data = await this.prisma.load.findUniqueOrThrow({
        where: {
          id: id
        }
      })
      return data
    } catch (error) {
      return {
        error: 500,
        message: "An error occurred while fetching the load",
      };
    }
  }
  async getMultipleLoads(query) {
    const conditions: any = {};

    for (const [key, value] of Object.entries(query)) {
      if (value) {
        if (key === 'email') {
          conditions[key] = { contains: value, mode: 'insensitive' };
        } else if (key === 'name') {
          conditions[key] = { equals: value };
        } else if (key === 'rate') {
          conditions[key] = { equals: Number(value) };
        } else {
          conditions[key] = { contains: value };
        }
      }
    }


    try {
      const data = await this.prisma.load.findMany({
        where: conditions,
        include: {
          bids: {
            select: {
              id: true,
              value: true,
              userName: true,
              status: true
            }
          }
        }
      })
      return data
    } catch (error) {
      return {
        error: 500,
        message: "An error occurred while fetching the load",
      };
    }
  }

  async createBid(datum) {
    try {
      const bid = await this.prisma.bid.create({
        data: {
          loadId: datum.loadId,
          userName: datum.userName,
          value: datum.value,
          status: BidStatus.Sent,
        }
      })
      return bid
    } catch (error) {
      return {
        error: 500,
        message: "An error occurred while creating the bid",
      };
    }

  }

  async acceptBid(bidId,loadId){
    const bid = await this.prisma.bid.update({data:  {
    status: BidStatus.Accepted},where: {
      id: bidId
    }})
    await this.closeAllOtherBids(loadId, bidId)
    return bid
  }

  private async closeAllOtherBids(loadId, bidId){
    const bids = await this.prisma.bid.updateMany({data: {
      status: BidStatus.Declined
    },where: {
      NOT: {
        id: bidId
      },
      AND: {
        loadId: loadId
      }
    }})
  }
  private async sanityCheckLoadIsNotClosed(loadId){
    const sanity = await this.prisma.load.findUnique({where: {
      id: loadId
      ,NOT: {
        status: LoadStatus.Close
      }
    }})

    console.log(sanity)
    if(!sanity){
      return "Load is closed, cannot modify"
    }
  }



  private getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
    var R = 6371; // Radius of the earth in km
    var dLat = this.deg2rad(lat2-lat1);  // deg2rad below
    var dLon = this.deg2rad(lon2-lon1); 
    var a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
      ; 
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    var d = R * c; // Distance in km
    return d;
  }
  private deg2rad(deg) {
    return deg * (Math.PI/180)
  }
  
  async getAllLoadsWithin(lat,lon,distance){
    const openloads = await this.prisma.load.findMany({
      where: {
        status: LoadStatus.Open
      },
      include: {
        pointA: true
      }
    })

    const nearbyloads = openloads.filter(load => 
    {
      const loadlat = load.pointA.latitude
      const loadlong = load.pointA.longitude
      const dist = Math.round(this.getDistanceFromLatLonInKm(loadlat, loadlong, lat, lon));
      load.distance = dist
      console.log(lat)
      console.log(lon)
      console.log('from db lat', loadlat)
      console.log('from db long ', loadlong)
      console.log("the distance between each is", dist)
      return dist < distance;
    }
    )
    return nearbyloads
  }
}

