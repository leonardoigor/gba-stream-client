// src/models/MatchData.ts

/**
 * Entidade de domínio que representa um Match retornado pelo backend.
 * Segue boas práticas de clean code e SOLID.
 */
export class MatchData {
  videoUrl: string;
  inputUrl: string;
  id?: string;
  stage_id?: string;
  group_id?: string;
  round_id?: string;
  number?: number;
  type?: string;
  status?: string;
  scheduled_datetime?: string;
  played_at?: string;
  public_note?: string;
  participant_note?: string;
  private_note?: string;
  report_closed?: boolean;
  report_status?: string;
  opponents?: any[];
  settings?: any;

  constructor(data: any) {
    this.videoUrl = data.videoUrl;
    this.inputUrl = data.inputUrl;
    this.id = data.id;
    this.stage_id = data.stage_id;
    this.group_id = data.group_id;
    this.round_id = data.round_id;
    this.number = data.number;
    this.type = data.type;
    this.status = data.status;
    this.scheduled_datetime = data.scheduled_datetime;
    this.played_at = data.played_at;
    this.public_note = data.public_note;
    this.participant_note = data.participant_note;
    this.private_note = data.private_note;
    this.report_closed = data.report_closed;
    this.report_status = data.report_status;
    this.opponents = data.opponents;
    this.settings = data.settings;
  }
} 