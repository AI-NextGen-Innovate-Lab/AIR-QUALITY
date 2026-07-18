import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { SensorVisibility } from '../../generated/prisma/client.js';

type ReadingRow = { id: string };

@Injectable()
export class SensorPrivacyService {
  constructor(private readonly prisma: PrismaService) {}

  async filterReadings<T extends ReadingRow>(
    readings: T[],
    userId?: number,
  ): Promise<T[]> {
    const privateSensors = await this.prisma.sensor.findMany({
      where: { visibility: SensorVisibility.PRIVATE },
      select: { topic: true, ownerId: true },
    });

    if (!privateSensors.length) {
      return readings;
    }

    const privateByTopic = new Map(
      privateSensors.map((s) => [s.topic, s.ownerId]),
    );

    return readings.filter((row) => {
      const ownerId = privateByTopic.get(row.id);
      if (ownerId === undefined) {
        return true;
      }
      if (!userId) {
        return false;
      }
      return ownerId === userId;
    });
  }

  async assertTopicAccess(topic: string, userId?: number): Promise<void> {
    const sensor = await this.prisma.sensor.findUnique({
      where: { topic },
      select: { visibility: true, ownerId: true },
    });

    if (
      sensor?.visibility === SensorVisibility.PRIVATE &&
      (!userId || sensor.ownerId !== userId)
    ) {
      throw new Error('Access denied to private sensor');
    }
  }
}
