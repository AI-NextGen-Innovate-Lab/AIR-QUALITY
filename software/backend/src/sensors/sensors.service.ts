import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { InfluxService } from '../influx/influx.service.js';
import { CreateSensorDto } from './dto/create-sensor.dto.js';
import { UpdateSensorDto } from './dto/update-sensor.dto.js';
import { Role, SensorVisibility } from '../../generated/prisma/client.js';
import { labelFromTopic, coordsFromTopic } from './sensor-metadata.util.js';

const sensorInclude = {
  owner: { select: { id: true, name: true, email: true, role: true } },
};

@Injectable()
export class SensorsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => InfluxService))
    private readonly influxService: InfluxService,
  ) {}

  private async logActivity(
    userId: number,
    action: string,
    description: string,
    metadata?: Record<string, unknown>,
  ) {
    try {
      await this.prisma.activityLog.create({
        data: { userId, action, description, metadata: (metadata ?? {}) as object },
      });
    } catch {
      // Non-fatal
    }
  }

  private async validateOwner(ownerId?: number | null) {
    if (ownerId == null) {
      return;
    }
    const owner = await this.prisma.user.findUnique({ where: { id: ownerId } });
    if (!owner) {
      throw new BadRequestException('Sensor owner not found');
    }
    if (owner.role !== Role.OWNER) {
      throw new BadRequestException('Sensor owner must have the OWNER role');
    }
  }

  private validateVisibility(visibility: SensorVisibility, ownerId?: number | null) {
    if (visibility === SensorVisibility.PRIVATE && !ownerId) {
      throw new BadRequestException('Private sensors must be assigned to an owner');
    }
  }

  findAll() {
    return this.prisma.sensor.findMany({
      orderBy: { createdAt: 'desc' },
      include: sensorInclude,
    });
  }

  findMine(ownerId: number) {
    return this.prisma.sensor.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
      include: sensorInclude,
    });
  }

  findPublicMapMetadata() {
    return this.prisma.sensor.findMany({
      where: { visibility: SensorVisibility.PUBLIC },
      orderBy: { label: 'asc' },
      select: {
        id: true,
        topic: true,
        label: true,
        latitude: true,
        longitude: true,
        visibility: true,
      },
    });
  }

  findMapMetadataForUser(userId?: number, userRole?: string) {
    if (userRole === 'OWNER' && userId) {
      return this.prisma.sensor.findMany({
        where: {
          OR: [
            { visibility: SensorVisibility.PUBLIC },
            { ownerId: userId, visibility: SensorVisibility.PRIVATE },
          ],
        },
        orderBy: { label: 'asc' },
        select: {
          id: true,
          topic: true,
          label: true,
          latitude: true,
          longitude: true,
          visibility: true,
          ownerId: true,
        },
      });
    }

    return this.findPublicMapMetadata();
  }

  async findAvailable(hours = 168) {
    const registered = await this.prisma.sensor.findMany({ include: sensorInclude });

    let influxTopics: Array<{ topic: string; lastSeen: string }> = [];
    try {
      influxTopics = await this.influxService.getDistinctTopics(hours);
    } catch {
      influxTopics = await this.influxService.getTopicsFromReadings(hours);
    }

    if (!influxTopics.length) {
      influxTopics = await this.influxService.getTopicsFromReadings(hours);
    }

    const byTopic = new Map(registered.map((s) => [s.topic, s]));
    const seen = new Set<string>();
    const items: Array<{
      topic: string;
      lastSeen: string | null;
      registered: boolean;
      id: number | null;
      label: string | null;
      latitude: number | null;
      longitude: number | null;
      visibility: SensorVisibility | null;
      ownerId: number | null;
      owner: (typeof registered)[0]['owner'] | null;
    }> = [];

    for (const row of influxTopics) {
      seen.add(row.topic);
      const reg = byTopic.get(row.topic);
      items.push({
        topic: row.topic,
        lastSeen: row.lastSeen,
        registered: !!reg,
        id: reg?.id ?? null,
        label: reg?.label ?? labelFromTopic(row.topic),
        latitude: reg?.latitude ?? coordsFromTopic(row.topic)?.latitude ?? null,
        longitude: reg?.longitude ?? coordsFromTopic(row.topic)?.longitude ?? null,
        visibility: reg?.visibility ?? null,
        ownerId: reg?.ownerId ?? null,
        owner: reg?.owner ?? null,
      });
    }

    for (const reg of registered) {
      if (!seen.has(reg.topic)) {
        items.push({
          topic: reg.topic,
          lastSeen: null,
          registered: true,
          id: reg.id,
          label: reg.label ?? labelFromTopic(reg.topic),
          latitude: reg.latitude,
          longitude: reg.longitude,
          visibility: reg.visibility,
          ownerId: reg.ownerId,
          owner: reg.owner,
        });
      }
    }

    return items.sort((a, b) => {
      const aTime = a.lastSeen ?? '';
      const bTime = b.lastSeen ?? '';
      return bTime.localeCompare(aTime);
    });
  }

  async create(dto: CreateSensorDto, actorId: number) {
    const visibility = dto.visibility ?? SensorVisibility.PUBLIC;
    await this.validateOwner(dto.ownerId);
    this.validateVisibility(visibility, dto.ownerId);

    const topic = dto.topic.trim();
    const defaults = coordsFromTopic(topic);
    const label = dto.label?.trim() || labelFromTopic(topic);
    const latitude = dto.latitude ?? defaults?.latitude ?? null;
    const longitude = dto.longitude ?? defaults?.longitude ?? null;

    const sensor = await this.prisma.sensor.create({
      data: {
        topic,
        label,
        latitude,
        longitude,
        visibility,
        ownerId: dto.ownerId ?? null,
      },
      include: sensorInclude,
    });

    await this.logActivity(actorId, 'SENSOR_CREATED', `Created sensor ${sensor.topic}`, {
      sensorId: sensor.id,
      visibility: sensor.visibility,
      ownerId: sensor.ownerId,
    });

    return sensor;
  }

  async update(id: number, dto: UpdateSensorDto, actorId: number) {
    const existing = await this.prisma.sensor.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Sensor not found');
    }

    const visibility = dto.visibility ?? existing.visibility;
    const ownerId =
      dto.ownerId !== undefined ? dto.ownerId : existing.ownerId;

    await this.validateOwner(ownerId ?? undefined);
    this.validateVisibility(visibility, ownerId);

    const topic = dto.topic?.trim() ?? existing.topic;
    const defaults = coordsFromTopic(topic);

    const sensor = await this.prisma.sensor.update({
      where: { id },
      data: {
        topic: dto.topic?.trim(),
        label:
          dto.label !== undefined
            ? dto.label?.trim() || labelFromTopic(topic)
            : existing.label ?? labelFromTopic(topic),
        latitude: dto.latitude ?? existing.latitude ?? defaults?.latitude ?? null,
        longitude: dto.longitude ?? existing.longitude ?? defaults?.longitude ?? null,
        visibility,
        ownerId,
      },
      include: sensorInclude,
    });

    await this.logActivity(actorId, 'SENSOR_UPDATED', `Updated sensor ${sensor.topic}`, {
      sensorId: sensor.id,
      visibility: sensor.visibility,
      ownerId: sensor.ownerId,
    });

    return sensor;
  }

  async remove(id: number, actorId: number) {
    const existing = await this.prisma.sensor.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Sensor not found');
    }

    await this.prisma.sensor.delete({ where: { id } });

    await this.logActivity(actorId, 'SENSOR_DELETED', `Deleted sensor ${existing.topic}`, {
      sensorId: id,
    });

    return { ok: true };
  }
}
