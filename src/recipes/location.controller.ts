import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LocationService } from './location.service';
import { CreateLocationDto, UpdateLocationDto, LocationResponseDto } from './dto/location.dto';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('User Locations')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('api/locations')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Post()
  @ApiOperation({ 
    summary: 'Add new location',
    description: 'Add a new location for the user. First location becomes primary automatically.'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Location created successfully',
    type: LocationResponseDto 
  })
  async createLocation(
    @Request() req,
    @Body() createLocationDto: CreateLocationDto,
  ): Promise<LocationResponseDto> {
    return this.locationService.createLocation(req.user.id, createLocationDto);
  }

  @Get()
  @ApiOperation({ 
    summary: 'Get user locations',
    description: 'Get all locations for the current user, ordered by primary first.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Locations retrieved successfully',
    type: [LocationResponseDto] 
  })
  async getUserLocations(@Request() req): Promise<LocationResponseDto[]> {
    return this.locationService.getUserLocations(req.user.id);
  }

  @Get('primary')
  @ApiOperation({ 
    summary: 'Get primary location',
    description: 'Get the users primary location for recipe generation.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Primary location retrieved successfully',
    type: LocationResponseDto 
  })
  async getPrimaryLocation(@Request() req): Promise<LocationResponseDto | null> {
    return this.locationService.getPrimaryLocation(req.user.id);
  }

  @Get('active')
  @ApiOperation({ 
    summary: 'Get active locations',
    description: 'Get all active locations where daily recipes are generated.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Active locations retrieved successfully',
    type: [LocationResponseDto] 
  })
  async getActiveLocations(@Request() req): Promise<LocationResponseDto[]> {
    return this.locationService.getActiveLocations(req.user.id);
  }

  @Get(':locationId')
  @ApiOperation({ 
    summary: 'Get location by ID',
    description: 'Get a specific location by its ID.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Location retrieved successfully',
    type: LocationResponseDto 
  })
  async getLocationById(
    @Request() req,
    @Param('locationId') locationId: string,
  ): Promise<LocationResponseDto> {
    return this.locationService.getLocationById(req.user.id, locationId);
  }

  @Put(':locationId')
  @ApiOperation({ 
    summary: 'Update location',
    description: 'Update a location\'s details or status.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Location updated successfully',
    type: LocationResponseDto 
  })
  async updateLocation(
    @Request() req,
    @Param('locationId') locationId: string,
    @Body() updateLocationDto: UpdateLocationDto,
  ): Promise<LocationResponseDto> {
    return this.locationService.updateLocation(req.user.id, locationId, updateLocationDto);
  }

  @Delete(':locationId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: 'Delete location',
    description: 'Delete a location. If it\'s the primary location, another location will become primary automatically.'
  })
  @ApiResponse({ 
    status: 204, 
    description: 'Location deleted successfully' 
  })
  async deleteLocation(
    @Request() req,
    @Param('locationId') locationId: string,
  ): Promise<void> {
    return this.locationService.deleteLocation(req.user.id, locationId);
  }
} 