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
import { CreateEngineDto } from './dto/create-engine.dto';
import { UpdateEngineDto } from './dto/update-engine.dto';
import { EnginesService } from './engines.service';

@Controller('engines')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EnginesController {
  constructor(private readonly enginesService: EnginesService) {}

  @Get()
  @Roles('admin', 'client')
  findAll(@Req() request: any) {
    return this.enginesService.findAll(request.user);
  }

  @Get(':id')
  @Roles('admin', 'client')
  findOne(@Param('id', ParseIntPipe) id: number, @Req() request: any) {
    return this.enginesService.findOne(id, request.user);
  }

  @Post()
  @Roles('admin', 'client')
  create(@Body() createEngineDto: CreateEngineDto, @Req() request: any) {
    return this.enginesService.create(createEngineDto, request.user);
  }

  @Patch(':id')
  @Roles('admin')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEngineDto: UpdateEngineDto,
  ) {
    return this.enginesService.update(id, updateEngineDto);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.enginesService.remove(id);
  }
}
