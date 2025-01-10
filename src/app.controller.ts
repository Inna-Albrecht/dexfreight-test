import { Body, Controller, Get, HttpStatus, Param, ParseFloatPipe, ParseIntPipe, Post, Put, Query, Req, Res, Response } from '@nestjs/common';
import { AppService } from './app.service';
import { Load } from '@prisma/client';



@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }


  @Post('/load/new')
  async createLoad(@Req() req: Request, @Body() __data, @Res() response) {
    const responseData = await this.appService.createLoad(__data)
    console.log('%csrc/app.controller.ts:19 responseData', 'color: #007acc;', responseData);
    if (responseData) {
      response.status(HttpStatus.ACCEPTED).send(responseData);
      console.log('%csrc/app.controller.ts:21 responseData', 'color: #007acc;', responseData);
    } else {
      response.status(HttpStatus.BAD_REQUEST).send(responseData);
    }
    return responseData
  }

  @Put('load/:id')
  async updateLoad(@Param('id', ParseIntPipe) id, @Body() body, @Response() response) {

    const responseData = await this.appService.updateLoad(id, body)

    if (responseData) {
      response.status(HttpStatus.ACCEPTED).send(responseData);
      console.log('%csrc/app.controller.ts:21 responseData', 'color: #007acc;', responseData);
    } else {
      response.status(HttpStatus.BAD_REQUEST).send(responseData);
    }
    return responseData
  }


  @Get('load/search')
  async getAnyLoads(@Query() params: any, @Res() response) {

    const responseData = await this.appService.getMultipleLoads(params)

    if (responseData) {
      response.status(HttpStatus.ACCEPTED).send(responseData);
      console.log('%csrc/app.controller.ts:21 responseData', 'color: #007acc;', responseData);
    } else {
      response.status(HttpStatus.BAD_REQUEST).send(responseData);
    }
    return responseData
  }
  @Get('load/:id')
  async getLoad(@Param('id', ParseIntPipe) id) {
    return await this.appService.getLoad(id)
  }

  @Post('/load/bid')
  async createBid(@Req() req, @Res() response, @Body() body) {
    const responseData = await this.appService.createBid(body)

    if (responseData) {
      response.status(HttpStatus.ACCEPTED).send(responseData);
      console.log('%csrc/app.controller.ts:21 responseData', 'color: #007acc;', responseData);
    } else {
      response.status(HttpStatus.BAD_REQUEST).send(responseData);
    }
    return responseData
  }

  @Get('/load/acceptbid/:id/:loadid')
  async acceptBid(@Param('id', ParseIntPipe) id: number, @Param('loadid', ParseIntPipe) loadid: number) {
    return await this.appService.acceptBid(id, loadid)
  }

  @Get('load/nearby/:lat/:lng/:dist')
  async getLoadsByDistance(@Param('lat', ParseFloatPipe) lat: any, @Param('lng', ParseFloatPipe) lng: any, @Param('dist', ParseFloatPipe) dist: any,
    @Res() response) {
    const responseData = await this.appService.getAllLoadsWithin(lat, lng, dist)
    if (responseData) {
      response.status(HttpStatus.ACCEPTED).send(responseData);
      console.log('%csrc/app.controller.ts:21 responseData', 'color: #007acc;', responseData);
    } else {
      response.status(HttpStatus.BAD_REQUEST).send(responseData);
    }
    return responseData
  }

}
