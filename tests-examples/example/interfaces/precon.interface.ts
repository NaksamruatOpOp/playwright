export interface UserParams {
    IsStandAlone?: boolean;
}

export interface GroupUserParams extends UserParams {
    role: string;
}

export interface CreateUserParams extends GroupUserParams {
    userData: any,
    managerId?: number,
}


export interface PreConParams {
    departmentId: number;
    positionId: number;
    levelId: number;
}

export interface SettingContentParams {
    content: string,
    isMaterial?: boolean
}

export interface QuestionParams {
    question: string;
    hint: string;
    total_choice?: string[];
    desc?: string;
}

export interface choiceParams  {
    bankID: string
    questionId: string, 
    choices: string[], 
    correctAnswer: string
}

export interface courseParams {
    course: string;
}

export interface VerifyAssignUserParams {
    content: string;
}

export interface AssignUserParams extends VerifyAssignUserParams {
    idContent: string;
}

interface BaseAssignmentParams {
    assignmentId: string;
}

export interface AddLearnerParams extends BaseAssignmentParams {}
export interface ConfirmAssignParams extends BaseAssignmentParams {}

export interface AddContentParams extends BaseAssignmentParams {
    external_code: string;
    idContent: string;
}
