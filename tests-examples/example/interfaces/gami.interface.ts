export interface NavigationOptions {
    path: string;
    waitApi: string;
    selector: string;
}

export interface ContentGamiOptions {
    content: string
}

export interface PublishOptions {
    isPublic?: boolean
}

export interface EditOptions {
    isEdit?: boolean
}

export interface VerifyCriteriaContentOptions extends ContentGamiOptions, PublishOptions {}
export interface VerifyGamiContentOptions extends ContentGamiOptions, EditOptions {}


