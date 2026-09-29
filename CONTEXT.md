# Painel de Carreira

A personal job-search tracker: one person follows each job they are interested in from first interest to outcome, and reviews their search through metrics and planning notes.

## Applications and the pipeline

**Application**:
One job opening the user is tracking, from the moment it catches their interest until it is closed. It exists before anything has been sent: an Application in the first Stage is still an Application.
_Avoid_: Job, Opening, Vaga, Card, Opportunity

**Stage**:
A step of the hiring pipeline an Application sits in: Interest, Applied, Contact/Screening, Interview, Technical Test, Offer, and the terminal Rejected Stage.
_Avoid_: Phase, Step, Column, Status, Lane

**Applied**:
An Application is Applied once it has reached the Applied Stage or any later non-rejection Stage, at any point in its history. Interest alone is not Applied.
_Avoid_: Sent, Submitted

**Applied date**:
The date the user entered on the Application; if empty, when it first entered Applied or later; if that is unknown, when it was created.

**Active**:
An Application that is Applied, not Rejected and not Archived.
_Avoid_: Open, Ongoing

**Offer**:
The last non-rejection Stage. There is no accepted or declined outcome yet: an Application whose Offer is settled is closed by archiving it.

## Rejection

**Rejection**:
The outcome of an Application that ended against the user: a reason, a date and the Stage it was rejected from. It is represented as the terminal Rejected Stage; only the current Rejection shows on the Application, every past one stays in the Application's history.
_Avoid_: Failure, Refusal

**Restore**:
Moving a Rejected Application back to a non-rejection Stage, clearing its current Rejection.
_Avoid_: Reopen, Unreject

**Response rate**:
Of the Applied Applications, the share that reached Contact/Screening or were rejected for any reason other than "no reply".

## Closing without an outcome

**Archive**:
Taking an Application out of the current work: off the board, the KPIs, the weekly goal and the next actions, while it still counts in historical metrics (funnel, rejection reasons, per month, time per Stage). Unarchiving puts it back at the top of its Stage.
_Avoid_: Hide, Close

**Delete**:
Erasing an Application and its whole history. Meant for Applications created by mistake, not for closing one.

## Tracking

**Origin**:
Whether an Application is in Brazil or Abroad, derived from its country. Every Application has a country.
_Avoid_: Section, Nacional, Internacional, Domestic

**Next action**:
A dated note on an Application saying what the user must do next. It is overdue when its date is before today.
_Avoid_: Reminder, Task, Follow-up

**Weekly goal**:
The number of Applications the user aims to have Applied per week, Monday to Sunday, counted by Applied date.

**History**:
The ordered record of what happened to an Application: created, Stage changes, Rejections, Restores, notes, edits, Archive and Unarchive.
_Avoid_: Log, Timeline

## Documents and planning

**Document**:
A file in the user's library, such as one version of a CV.
_Avoid_: File, Attachment

**Resume**:
The Document linked to an Application as the version sent for it. Deleting the Document only unlinks it.
_Avoid_: CV (in code and docs)

**Draft**:
A free text the user writes and keeps in Planning, such as their pitch.
_Avoid_: Note, Text

**SWOT**:
Strengths, weaknesses, opportunities and threats written by the user, either for one Application or for their career as a whole (the **Career SWOT**).
