export interface ConfluencePageBody {
  storage?: {
    value?: string;
    representation?: string;
  };
}

export interface ConfluenceVersionInfo {
  number?: number;
  when?: string;
  message?: string;
  minorEdit?: boolean;
}

export interface ConfluenceSpaceInfo {
  key?: string;
  name?: string;
  type?: string;
}

export interface ConfluencePage {
  id: string;
  title: string;
  type: string;
  status: string;
  body?: ConfluencePageBody;
  version?: ConfluenceVersionInfo;
  space?: ConfluenceSpaceInfo;
  _links?: {
    webui?: string;
    self?: string;
    base?: string;
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
