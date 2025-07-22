import { ShareIcon } from "@components/icons";
import RatingCircle, { ColorRating } from "../RatingCircle";
import Form from "react-bootstrap/esm/Form";
import { useCallback, useState } from "react";
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import "katex/dist/katex.min.css";

const LC_RATING_PROGRESS_KEY = (questionID: string) =>
  `lc-rating-zen-progress-${questionID}`;

// Progress Related
type ProgressData = Record<string, string>;

enum Progress {
  TODO = "TODO",
  WORKING = "WORKING",
  TOO_HARD = "TOO_HARD",
  REVIEW_NEEDED = "REVIEW_NEEDED",
  AC = "AC",
}

const progressTranslations = {
  [Progress.TODO]: "下次一定",
  [Progress.WORKING]: "攻略中",
  [Progress.TOO_HARD]: "太难了，不会",
  [Progress.REVIEW_NEEDED]: "回头复习下",
  [Progress.AC]: "过了",
};
const progressOptionClassNames = {
  [Progress.TODO]: "zen-option-TODO",
  [Progress.WORKING]: "zen-option-WORKING",
  [Progress.TOO_HARD]: "zen-option-TOO_HARD",
  [Progress.REVIEW_NEEDED]: "zen-option-REVIEW_NEEDED",
  [Progress.AC]: "zen-option-AC",
};



type ProblemCategory = {
  title: string;
  summary?: string;
  src?: string;
  original_src?: string;
  sort?: Number;
  isLeaf?: boolean;
  solution?: string | null;
  score?: Number | null;
  leafChild?: ProblemCategory[];
  nonLeafChild?: ProblemCategory[];
  isPremium?: boolean;
  last_update?: string;
}

interface ProblemCategoryProps {
  title?: string;
  summary?: string;
  data?: ProblemCategory[];
  className?: string;
  level?: number;
  showEn?: boolean;
  showRating?: boolean;
  showPremium?: boolean;
}

function ProblemCategory({
  title,
  summary,
  data,
  className = "",
  level = 0,
  showEn,
  showRating,
  showPremium,
}: ProblemCategoryProps) {
  const { optionKeys, getOption } = useProgressOptions();
  const { allProgress, updateProgress, removeProgress } = useQuestProgress();

  return (
    <div className={`pb-container level-${level}` + className}>
      {
        <h3 className="title p-2 text-danger" id={`${hashCode(title || "")}`}>
          <p dangerouslySetInnerHTML={{ __html: title || "" }}></p>
        </h3>
      }
      {summary && (
        <span
          className="d-inline-block p-2 mb-2 rounded summary bg-secondary-subtle text-warning-emphasis"
        >
          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex, rehypeRaw]}>{summary}</ReactMarkdown>
        </span>
      )}
      <div className={`level-${level}`}>
        {data &&
          data.map((item) => {
            let summary = item.leafChild.length == 0 ? item.summary : "";
            let title = item.leafChild.length == 0 ? item.title : "";
            return (
              <div key={hashCode(item.title || "") + "head"}>
                {item.leafChild.length > 0 ? (
                  <ProblemCategoryList
                  optionKeys={optionKeys}
                  getOption={getOption}
                  allProgress={allProgress}
                  updateProgress={updateProgress}
                  removeProgress={removeProgress}
                  showEn={showEn}
                  showRating={showRating}
                  showPremium={showPremium}
                  data={item}
                  key={hashCode(item.title || "") + "leaf"}
                  />
                ) : <></>}
                <ProblemCategory
                  showEn={showEn}
                  showRating={showRating}
                  showPremium={showPremium}
                  level={level + 1}
                  title={title}
                  data={item.nonLeafChild}
                  summary={summary}
                  key={hashCode(item.title || "") + "nonLeaf"}
                />
              </div>
            );
          })}
      </div>
    </div>
  );
}

function ProblemCategoryList({
  data,
  className = "",
  en,
  rating,
}: {
  data: ProblemCategory;
  className?: string;
  en?: boolean;
  rating?: boolean;
}) {
  const getCols = (l: number) => {
    if (l < 12) {
      return "";
    }
    if (l < 20) {
      return "col2";
    }
    return "col3";
  };

  const [localStorageProgressData, setLocalStorageProgressData] =
    useState<ProgressData>({});

  // Event handlers
  const handleProgressSelectChange = useCallback(
    (questionId: string, value: string) => {
      const newValue = value || Progress.TODO;
      localStorage.setItem(LC_RATING_PROGRESS_KEY(questionId), newValue);
      setLocalStorageProgressData((prevData) => ({
        ...prevData,
        [questionId]: newValue,
      }));
    },
    []
  );

  const title2id = (title: string) => {
    // title: number. title
    return title.split(".")[0];
  }

  const progress = (title: string) => {
    const localtemp = localStorage.getItem(LC_RATING_PROGRESS_KEY(title2id(title)));
    return localtemp || Progress.TODO;
  }

  return (
    <div className="shadow rounded p-2 leaf">
      <h3 className="title" id={`${hashCode(data.title || "")}`}>{data.title}</h3>
      {data.summary && (
        <p className="p-2 rounded summary bg-secondary-subtle text-warning-emphasis">
          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex, rehypeRaw]}>{data.summary}</ReactMarkdown>
        </p>
      )}
      <ul className={`list p-2 ${data.child && getCols(data.child.length)}`}>
        {data.child &&
          data.child.map((item) => (
            <li className="d-flex justify-content-between">
              <a
                href={"https://leetcode.cn/problems" + item.src}
                target="_blank"
              >
                {item.title + (item.isPremium ? " (会员题)" : "")}
                {en && <a className="ms-2" href={"https://leetcode.com/problems" + item.src} target="_blank">
                  <ShareIcon height={16} width={16} />
                </a>}
              </a>
              {item.score && rating ? (
                <div className="ms-2 text-nowrap d-flex justify-content-center align-items-center pb-rating-bg">
                  <RatingCircle difficulty={Number(item.score)} />
                  <ColorRating
                    className="rating-text"
                    rating={Number(item.score)}
                  >
                    {Number(item.score).toFixed(0)}
                  </ColorRating>
                </div>
              ) : null}
              <div className="d-flex align-items-center ms-2">
                <Form.Select
                  className={progressOptionClassNames[progress(item.title)] || ""}
                  value={progress(item.title) === Progress.TODO ? "" : progress(item.title)}
                  onChange={(e) =>
                    handleProgressSelectChange(title2id(item.title), e.target.value)
                  }
                >
                  {/* Empty option for TODO */}
                  <option value=""></option>

                  {[
                    Progress.WORKING,
                    Progress.TOO_HARD,
                    Progress.REVIEW_NEEDED,
                    Progress.AC,
                  ].map((p) => (
                    <option
                      key={p}
                      value={p}
                      className={progressOptionClassNames[p] || ""}
                    >
                      {progressTranslations[p]}
                    </option>
                  ))}
                </Form.Select>
              </div>
            </li>
          ))}
      </ul>
    </div>
  );
}

export default ProblemCategory;
