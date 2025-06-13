import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLocationDto, UpdateLocationDto, LocationResponseDto } from './dto/location.dto';

@Injectable()
export class LocationService {
  constructor(private readonly prisma: PrismaService) {}

  async createLocation(userId: string, createLocationDto: CreateLocationDto): Promise<LocationResponseDto> {
    // If this is set as primary, make sure no other location is primary
    if (createLocationDto.isPrimary) {
      await this.prisma.userLocation.updateMany({
        where: { userId },
        data: { isPrimary: false }
      });
    }

    // If this is the user's first location, make it primary by default
    const existingLocationsCount = await this.prisma.userLocation.count({
      where: { userId }
    });

    const shouldBePrimary = createLocationDto.isPrimary ?? (existingLocationsCount === 0);

    const location = await this.prisma.userLocation.create({
      data: {
        userId,
        name: createLocationDto.name,
        country: createLocationDto.country,
        countryCode: createLocationDto.countryCode,
        timezone: createLocationDto.timezone,
        latitude: createLocationDto.latitude,
        longitude: createLocationDto.longitude,
        isPrimary: shouldBePrimary,
      }
    });

    return this.mapLocationToResponse(location);
  }

  async getUserLocations(userId: string): Promise<LocationResponseDto[]> {
    const locations = await this.prisma.userLocation.findMany({
      where: { userId },
      orderBy: [
        { isPrimary: 'desc' }, // Primary first
        { createdAt: 'asc' }   // Then by creation date
      ]
    });

    return locations.map(this.mapLocationToResponse);
  }

  async getLocationById(userId: string, locationId: string): Promise<LocationResponseDto> {
    const location = await this.prisma.userLocation.findFirst({
      where: { 
        id: locationId,
        userId 
      }
    });

    if (!location) {
      throw new NotFoundException('Location not found');
    }

    return this.mapLocationToResponse(location);
  }

  async updateLocation(userId: string, locationId: string, updateLocationDto: UpdateLocationDto): Promise<LocationResponseDto> {
    // Check if location exists and belongs to user
    const existingLocation = await this.prisma.userLocation.findFirst({
      where: { 
        id: locationId,
        userId 
      }
    });

    if (!existingLocation) {
      throw new NotFoundException('Location not found');
    }

    // If setting this as primary, remove primary status from others
    if (updateLocationDto.isPrimary) {
      await this.prisma.userLocation.updateMany({
        where: { 
          userId,
          id: { not: locationId }
        },
        data: { isPrimary: false }
      });
    }

    // If trying to set primary to false, ensure at least one location remains primary
    if (updateLocationDto.isPrimary === false && existingLocation.isPrimary) {
      const otherLocationsCount = await this.prisma.userLocation.count({
        where: { 
          userId,
          id: { not: locationId }
        }
      });

      if (otherLocationsCount === 0) {
        throw new BadRequestException('Cannot remove primary status when it\'s the only location');
      }

      // Make the first other location primary
      const firstOtherLocation = await this.prisma.userLocation.findFirst({
        where: { 
          userId,
          id: { not: locationId }
        },
        orderBy: { createdAt: 'asc' }
      });

      if (firstOtherLocation) {
        await this.prisma.userLocation.update({
          where: { id: firstOtherLocation.id },
          data: { isPrimary: true }
        });
      }
    }

    const updatedLocation = await this.prisma.userLocation.update({
      where: { id: locationId },
      data: updateLocationDto
    });

    return this.mapLocationToResponse(updatedLocation);
  }

  async deleteLocation(userId: string, locationId: string): Promise<void> {
    const location = await this.prisma.userLocation.findFirst({
      where: { 
        id: locationId,
        userId 
      }
    });

    if (!location) {
      throw new NotFoundException('Location not found');
    }

    // If deleting primary location, make another one primary
    if (location.isPrimary) {
      const otherLocation = await this.prisma.userLocation.findFirst({
        where: { 
          userId,
          id: { not: locationId }
        },
        orderBy: { createdAt: 'asc' }
      });

      if (otherLocation) {
        await this.prisma.userLocation.update({
          where: { id: otherLocation.id },
          data: { isPrimary: true }
        });
      }
    }

    await this.prisma.userLocation.delete({
      where: { id: locationId }
    });
  }

  async getPrimaryLocation(userId: string): Promise<LocationResponseDto | null> {
    const location = await this.prisma.userLocation.findFirst({
      where: { 
        userId,
        isPrimary: true 
      }
    });

    return location ? this.mapLocationToResponse(location) : null;
  }

  async getActiveLocations(userId: string): Promise<LocationResponseDto[]> {
    const locations = await this.prisma.userLocation.findMany({
      where: { 
        userId,
        isActive: true 
      },
      orderBy: [
        { isPrimary: 'desc' },
        { createdAt: 'asc' }
      ]
    });

    return locations.map(this.mapLocationToResponse);
  }

  private mapLocationToResponse(location: any): LocationResponseDto {
    return {
      id: location.id,
      name: location.name,
      country: location.country,
      countryCode: location.countryCode,
      timezone: location.timezone,
      latitude: location.latitude,
      longitude: location.longitude,
      isPrimary: location.isPrimary,
      isActive: location.isActive,
      createdAt: location.createdAt,
    };
  }
} 