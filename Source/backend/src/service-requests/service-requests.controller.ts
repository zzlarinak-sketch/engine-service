import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { UpdateServiceRequestDto } from './dto/update-service-request.dto';
import { ServiceRequestsService } from './service-requests.service';

@Controller('service-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ServiceRequestsController {
  constructor(private readonly serviceRequestsService: ServiceRequestsService) {}

  @Get()
  @Roles('admin', 'client')
  findAll(@Req() request: any) {
    return this.serviceRequestsService.findAll(request.user);
  }

  @Get(':id')
  @Roles('admin', 'client')
  findOne(@Param('id', ParseIntPipe) id: number, @Req() request: any) {
    return this.serviceRequestsService.findOne(id, request.user);
  }

  @Post()
  @Roles('admin', 'client')
  create(
    @Body() createServiceRequestDto: CreateServiceRequestDto,
    @Req() request: any,
  ) {
    return this.serviceRequestsService.create(createServiceRequestDto, request.user);
  }

  @Patch(':id')
  @Roles('admin')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateServiceRequestDto: UpdateServiceRequestDto,
  ) {
    return this.serviceRequestsService.update(id, updateServiceRequestDto);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.serviceRequestsService.remove(id);
  }
}
