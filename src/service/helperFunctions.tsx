import {
  TagType,
  StepAction,
  Step,
  ScrappedStep,
  OptionType,
  StepOption,
  MouseClick,
  KeyInput,
  Tink,
} from "../types";
import { ADMIN_SECRET, GITHUB_TOKEN } from "../env";
import { v4 as uuidv4 } from "uuid";

export const makeGithubIssue = async (
  description: string,
  tinkID: string | null
): Promise<string> => {
  const postedIssue = await fetch(
    "https://api.github.com/repos/baptisteArno/tinking/issues",
    {
      method: "post",
      body: JSON.stringify({
        title: "(Automated Issue) " + description.slice(0, 20) + "...",
        body: `${
          tinkID ? `Tink ID: "${tinkID}"` : "No Tink ID"
        }\nDescription: ${description}`,
      }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `token ${GITHUB_TOKEN}`,
      },
    }
  ).then((res) => res.json());

  return postedIssue.html_url;
};

export const saveTink = async (steps: Step[]): Promise<string> => {
  // save all the steps belonging to a tink and return the tink.id
  type SaveTinkVariables = {
    steps: Step[];
  };
  const tinkID = uuidv4();

  return tinkID;
};

type FeedbackResponse = null | string;
export const submitFeedback = async (
  description: string,
  makeTink: boolean,
  steps: Step[]
): Promise<FeedbackResponse> => {
  // submit the feedback and return the tink.id
  type FeedbackVariables = {
    description: string;
    makeTink: boolean;
    steps: Step[];
  };
  const response: FeedbackResponse = null;
  if (!response) {
    return null;
  }
  const tinkId = response;
  return tinkId;
};

export const loadTink = async (tinkId: string): Promise<Step[] | null> => {
  // Get all of the tink data by passing a tink.id
  type LoadTinkVariables = {
    tinkId: string;
  };
  const response: Tink | null = null;
  // const GET_TINK = `query MyQuery {
  //   Tink(where: {id: {_eq: "${tinkID}"}}) {
  //     dateCreated
  //     website
  //     Steps {
  //       index
  //       totalSelected
  //       StepAction {
  //         action
  //         selector
  //         tagName
  //         RecordActions {
  //           index
  //           isClick
  //           selector
  //         }
  //         Options {
  //           type
  //           value
  //         }
  //       }
  //     }
  //   }
  // }`;
  if (!response) {
    return null;
  }
  return tinkToSteps(response);
};

export const tinkToSteps = (tink: any): Step[] => {
  const parsed = [];
  for (let i = 0; i < tink.Steps.length; i++) {
    const currentTinkStep = tink.Steps.find((s: any) => s.index === i);
    const newStep: Step = {
      id: uuidv4(),
      options: [],
    };

    if (i === 0) newStep.content = tink.website;
    newStep.totalSelected = currentTinkStep.totalSelected;
    newStep.action = currentTinkStep.StepAction.action;
    newStep.selector = currentTinkStep.StepAction.selector;
    newStep.tagName = currentTinkStep.StepAction.tagName;

    if (currentTinkStep.StepAction.Options.length) {
      for (let oi = 0; oi < currentTinkStep.StepAction.Options.length; oi++) {
        const currentOption = currentTinkStep.StepAction.Options[oi];
        const newOption: StepOption = currentOption;
        newStep.options.push(newOption);
      }
    }

    if (currentTinkStep.StepAction.RecordActions.length) {
      newStep.recordedClicksAndKeys = [];
      for (
        let rai = 0;
        rai < currentTinkStep.StepAction.RecordActions.length;
        rai++
      ) {
        const currentRecordAction = currentTinkStep.StepAction.RecordActions.find(
          (ra: any) => ra.index === rai
        );
        if (currentRecordAction.isClick) {
          const newRecordAction: MouseClick = {
            selector: currentRecordAction.selector,
          };
          newStep.recordedClicksAndKeys.push(newRecordAction);
        } else {
          const newRecordAction: KeyInput = {
            input: currentRecordAction.selector,
          };
          newStep.recordedClicksAndKeys.push(newRecordAction);
        }
      }
    }

    parsed.push(newStep);
  }

  return parsed;
};

export const fetchGraphQL = async (
  schema: string,
  variables = {}
): Promise<any> => {
  const graphql = JSON.stringify({
    query: schema,
    variables,
  });
  const requestOptions = {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-hasura-admin-secret": ADMIN_SECRET,
    },
    body: graphql,
  };
  const database_url = "https://tinkingdb.hasura.app/v1/graphql";
  const res = await fetch(database_url, requestOptions).then((res: any) =>
    res.json()
  );
  return res;
};
export const parseTagTypeFromAction = (action: StepAction): TagType => {
  if (action === StepAction.EXTRACT_HREF || action === StepAction.NAVIGATE) {
    return TagType.LINK;
  }
  if (action === StepAction.EXTRACT_IMAGE_SRC) {
    return TagType.IMAGE;
  }
  return TagType.CONTAINER;
};
export const parseTagType = (tagName: string): TagType => {
  if (tagName === "a") {
    return TagType.LINK;
  }
  if (tagName === "img") {
    return TagType.IMAGE;
  }
  return TagType.CONTAINER;
};

export const parseDefaultAction = (tagName: string): StepAction => {
  if (tagName === "a") {
    return StepAction.NAVIGATE;
  }
  if (tagName === "img") {
    return StepAction.EXTRACT_IMAGE_SRC;
  }
  return StepAction.EXTRACT_TEXT;
};

export const getSelectorContent = (
  action: StepAction,
  selector?: string
): string | undefined => {
  if (!selector) {
    return "";
  }
  const element = parent.document.querySelector(selector);
  if (!element) {
    return;
  }
  switch (action) {
    case StepAction.EXTRACT_TEXT: {
      return (
        element.textContent?.replace(/(\r\n|\n|\r)/gm, "").trim() ?? undefined
      );
    }
    case StepAction.EXTRACT_IMAGE_SRC: {
      return (element as HTMLImageElement).src;
    }
    case StepAction.EXTRACT_HREF:
    case StepAction.NAVIGATE: {
      return (element as HTMLAnchorElement).href;
    }
  }
  return;
};

export const parseStepFromWebpage = (
  data: ScrappedStep
): Omit<Step, "id" | "options"> => {
  return {
    selector: data.selector,
    totalSelected: data.total,
    tagName: data.tagName,
    tagType: parseTagType(data.tagName),
    content: data.content,
  };
};

export const actionIsExpectingSelector = (action: StepAction): boolean =>
  [
    StepAction.EXTRACT_HREF,
    StepAction.EXTRACT_IMAGE_SRC,
    StepAction.EXTRACT_TEXT,
    StepAction.NAVIGATE,
  ].includes(action);

export const isAnExtractionAction = (action?: StepAction): boolean =>
  [
    StepAction.EXTRACT_HREF,
    StepAction.EXTRACT_IMAGE_SRC,
    StepAction.EXTRACT_TEXT,
  ].includes(action ?? StepAction.NAVIGATE);

export const launchNodeSelection = (
  stepIndex: number,
  tagType?: TagType | "pagination",
  params?: { optionIndex?: number; record?: boolean }
): void =>
  params?.record
    ? startRecordingClicksKeys(stepIndex)
    : startNodeSelection(stepIndex, tagType, params);

export const stopNodeSelection = (): void => {
  parent.postMessage({ type: "SELECT_NODE", command: "stop" }, "*");
};

const startNodeSelection = (
  stepIndex: number,
  tagType?: TagType | "pagination",
  params?: { optionIndex?: number; record?: boolean }
): void =>
  parent.postMessage(
    {
      type: "SELECT_NODE",
      command: "start",
      stepIndex,
      tagType,
      optionIndex: params?.optionIndex ?? null,
    },
    "*"
  );

const startRecordingClicksKeys = (stepIndex: number): void =>
  parent.postMessage(
    {
      type: "RECORD_CLICKS_KEYS",
      command: "start",
      stepIndex,
    },
    "*"
  );

export const stopRecordingClicksKeys = (stepIndex: number): void =>
  parent.postMessage(
    {
      type: "RECORD_CLICKS_KEYS",
      command: "stop",
      stepIndex,
    },
    "*"
  );

export const findUniqueSelector = (
  selector: string,
  index: number,
  selectingNodeIndex: number
): void => {
  parent.postMessage(
    {
      type: "SELECT_NODE",
      command: "findUniqueSelector",
      selector,
      index,
      selectingNodeIndex,
    },
    "*"
  );
};

export const isStepInActionProcess = (step: Step): boolean => {
  const isRecordingButNoInputs =
    step.recordedClicksAndKeys !== undefined &&
    step.recordedClicksAndKeys.length === 0;
  const isSelectingButNoTagName = !step.tagName;

  if (step.action === StepAction.RECORD_CLICKS_KEYS) {
    return isRecordingButNoInputs;
  }
  return isSelectingButNoTagName;
};

export const parseInputPlaceholderFromOption = (
  optionType?: OptionType
): string => {
  switch (optionType) {
    case OptionType.PAGINATION: {
      return "Node query selector";
    }
    case OptionType.REGEX: {
      return "Regex with group to match";
    }
    case OptionType.CUSTOM_AMOUNT_TO_EXTRACT: {
      return "Amount to extract";
    }
    default: {
      return "";
    }
  }
};
