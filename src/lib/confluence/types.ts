export interface ConfluencePageBody {
  storage?: {
    value?: string;
    representation?: string;
  };
}

export interface ConfluencePage {
  id: string;
  title: string;
  type: string;
  status: string;
  body?: ConfluencePageBody;
  _links?: {
    webui?: string;
    self?: string;
  };
}

export interface ConfluenceSearchResponse {
  results: ConfluencePage[];
  start: number;
  limit: number;
  size: number;
  _links?: {
    next?: string;
    prev?: string;
    base?: string;
  };
}
