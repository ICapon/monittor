import {
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Query,
  Req,
} from '@nestjs/common';
import { AuthenticatedRequest } from '../auth/middleware/auth.middleware';
import { CommandsService } from '../commands/commands.service';
import { ListVisitsDto } from './dto/list-visits.dto';
import { Visit } from './entities/visit.entity';
import { ListVisitsResult, VisitsService } from './visits.service';

// Gated by AuthMiddleware, applied to GET /visits and GET /visits/:id from
// this module's own configure() (see visits.module.ts — no circular-
// dependency concern here, unlike UsersModule/AuthModule). Plus the same
// per-command grant check used by /whoami and /users: only a user actually
// granted "get-visits" (the seeded admin, by default) can call this.
@Controller('visits')
export class VisitsController {
  constructor(
    private readonly visitsService: VisitsService,
    private readonly commandsService: CommandsService,
  ) {}

  @Get()
  async list(
    @Query() dto: ListVisitsDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<ListVisitsResult> {
    await this.assertGranted(req);

    return this.visitsService.findVisits({
      limit: dto.limit ?? 20,
      offset: dto.offset ?? 0,
      desc: dto.desc ?? true,
      startDate: dto.startDate,
      endDate: dto.endDate,
    });
  }

  // ParseUUIDPipe rejects a malformed id with a 400 before it ever reaches
  // the DB layer (visit ids are always uuids — see Visit entity).
  @Get(':id')
  async findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<Visit> {
    await this.assertGranted(req);

    const visit = await this.visitsService.findById(id);
    if (!visit) {
      throw new NotFoundException('Visit not found.');
    }
    return visit;
  }

  private async assertGranted(req: AuthenticatedRequest): Promise<void> {
    const granted = await this.commandsService.findAccessibleCommandsForUser(req.user!.sub);
    if (!granted.some((command) => command.name === 'get-visits')) {
      throw new ForbiddenException('You do not have permission to list visits.');
    }
  }
}
