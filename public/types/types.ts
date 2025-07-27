export interface Memory {
  available_mb: number;
  percent_used: number;
  total_mb: number;
}

export interface Status {
  is_restarting?: boolean;
  num_restarts?: number;
}
