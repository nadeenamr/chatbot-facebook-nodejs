
var pl = require("tau-prolog");
require("tau-prolog/modules/lists")( pl );

var session = pl.create( 1000 );

// Load the program

var program = 
    
      ":- use_module(library(lists))." + // Load the lists module
      //":- set_prolog_stack(global, limit(100 000 000 000))."+
      //"set_prolog_flag(stack_limit, 10 000 000 000)."+

      "subtract([], _, []). "+

      "subtract([Head|Tail], L2, L3) :- "+
            "memberchk(Head, L2), "+
            "!, "+
            "subtract(Tail, L2, L3). "+

      "subtract([Head|Tail1], L2, [Head|Tail3]) :- "+
            "subtract(Tail1, L2, Tail3). "+

      "memberchk(X,[X|_]) :- "+
            "!. "+ 

      "memberchk(X,[_|T]):- "+
            "memberchk(X,T). "+

      "cs_semester(1,36)."+ /* 38/36 */
      "cs_semester(2,28)."+ /* 30/28 */
      "cs_semester(3,37)."+
      "cs_semester(4,34)."+
      "cs_semester(5,28)."+ /* 28/30 */
      "cs_semester(6,24)."+
      "cs_semester(7,24)."+
      "cs_semester(8,18)."+
      "cs_semester(9,20)."+
      "cs_semester(10,26)."+

      "lang_course(de,1,de101,4)."+
      "lang_course(de,2,de202,4)."+
      "lang_course(de,3,de303,4)."+
      "lang_course(de,4,de404,4)."+

      "lang_course(eng,1,ae101,6)."+
      "lang_course(eng,2,as102,4)."+
      "lang_course(eng,3,sm101,2)."+
      "lang_course(eng,4,cps402,2)."+
      "lang_course(eng,5,rpw401,2)."+

      "cs_course(csen102,1,6)."+
      "cs_course(math103,1,8)."+
      "cs_course(chemp102,1,2)."+
      "cs_course(chemt102,1,4)."+
      "cs_course(phys101,1,5)."+
      "cs_course(engd301,1,3)."+

      "cs_course(math203,2,8)."+
      "cs_course(phys202,2,5)."+
      "cs_course(csen202,2,6)."+
      "cs_course(elct201,2,4)."+
      "cs_course(edpt201,2,3)."+

      "cs_course(math301,3,8)."+
      "cs_course(physp301,3,2)."+
      "cs_course(physt301,3,5)."+
      "cs_course(elct301,3,6)."+
      "cs_course(csen301,3,6)."+

      "cs_course(math401,4,4)."+
      "cs_course(csen403,4,4)."+
      "cs_course(csis402,4,4)."+
      "cs_course(csen401,4,4)."+
      "cs_course(elct401,4,6)."+
      "cs_course(comm401,4,6)."+

      "cs_course(math501,5,4)."+
      "cs_course(dmet501,5,4)."+
      "cs_course(csen501,5,6)."+
      "cs_course(csen503,5,4)."+
      "cs_course(csen605,5,4)."+
      "cs_course(csen502,5,6)."+

      "cs_course(csen601,6,6)."+
      "cs_course(csen602,6,4)."+
      "cs_course(mngt601,6,2)."+
      "cs_course(csen603,6,4)."+
      "cs_course(csen604,6,4)."+
      "cs_course(dmet602,6,4)."+

      "cs_course(csen701,7,5)."+
      "cs_course(dmet502,7,6)."+
      "cs_course(csen703,7,4)."+
      "cs_course(csen702,7,5)."+
      "cs_course(csen704,7,4)."+

      "cs_course(dmet901,9,4)."+
      "cs_course(csen901,9,4)."+
      "cs_course(csen903,9,4)."+

      "cs_course(electiveI,9,4)."+ /* CSEN90- or DMET90- */
      "cs_course(electiveII,9,4)."+ /* CSEN90- or DMET90- */

      "cs_course(electiveI,10,4)."+ /* CSEN10-- or DMET10-- */
      "cs_course(electiveII,10,4)."+ /* CSEN10-- or DMET10-- */
      "cs_course(seminar,10,2)."+ /* CSEN10-- or DMET10-- */

      "cs_course(huma1001,10,4)."+
      "cs_course(csen1001,10,4)."+
      "cs_course(csen1002,10,4)."+
      "cs_course(csen1003,10,4)."+

      "prereq(math203,math103)."+
      "prereq(phys202,phys101)."+
      "prereq(csen202,csen102)."+
      "prereq(math301,math103)."+
      "prereq(math301,math203)."+
      "prereq(physt301,phys101)."+
      "prereq(physt301,phys202)."+
      "prereq(csen301,csen102)."+
      "prereq(csen301,csen202)."+
      "prereq(math401,math301)."+
      "prereq(math401,math203)."+
      "prereq(math401,math301)."+
      "prereq(csen403,csen202)."+
      "prereq(csis402,elct201)."+
      "prereq(csen401,csen202)."+
      "prereq(csen401,csen301)."+
      "prereq(elct401,elct301)."+
      "prereq(dmet501,csen202)."+
      "prereq(csen601,elct201)."+
      "prereq(csen601,csis402)."+
      "prereq(csen602,csen301)."+
      "prereq(csen604,csen501)."+
      "prereq(dmet602,csen503)."+
      "prereq(dmet502,csen202)."+
      "prereq(dmet502,csen301)."+
      "prereq(csen702,csen601)."+
      "prereq(dmet901,dmet502)."+
      "prereq(csen901,csen301)."+
      "prereq(csen1002,sen502)."+
      "prereq(csen1003,csen502)."+
      "prereq(dmet601,csen202)."+
      "prereq(dmet603,comm401)."+
      "prereq(dmet702,csen202)."+
      "prereq(dmet702,csen301)."+
      "prereq(dmet702,dmet502)."+
      "prereq(dmet703,dmet603)."+
      "prereq(dmet704,csen503)."+
      "prereq(dmet902,dmet603)."+
      "prereq(dmet902,dmet703)."+
      "prereq(dmet1001,dmet603)."+
      "prereq(dmet1003,dmet603)."+
      "prereq(dmet1003,comm401)."+

      /*--- cs_semester_courses ---*/

      "cs_semester_courses(SemesterNum,Courses):- "+
            "setof(X,Y^cs_course(X,SemesterNum,Y),Courses)."+

      /*--- cs_collective_credithours ---*/      

      "cs_collective_credithours([],0)."+

      "cs_collective_credithours([H|T],CH):- "+
            "cs_course(H,_,X), "+
            "cs_collective_credithours(T,X1), "+
            "CH is X+X1."+

      "cs_collective_credithours([H|T],CH):- "+
            "lang_course(_,_,H,X), "+
            "cs_collective_credithours(T,X1), "+
            "CH is X+X1."+

      /*--- cannotTake ---*/

      "cannotTake(StudentID, Courses):- "+
            "setof(X,cannot_take_helper(StudentID,X),Courses). "+

      "cannot_take_helper(StudentID, CourseCode):- "+
            "failed_course(StudentID,OtherCourseCode,a), "+
            "prereq(CourseCode,OtherCourseCode). "+

      /*--- studentPassedCourses ---*/

      "studentPassedCourses(StudentID,Courses):- "+
            "setof(X,passed_course(StudentID,X),Courses). "+

      /*--- studentFailedCourses ---*/

      "studentFailedCourses(StudentID,Courses):- "+
            "setof(X,Y^failed_course(StudentID,X,Y),Courses). "+

      /*--- getSchedule ---*/
      /*

      "getSchedule(StudentID,Courses):- "+
            "getScheduleHelper(StudentID,Courses). "+

      "getScheduleHelper(StudentID,Courses):- "+
            "student(StudentID,_,cs,CurrentSemester,_), "+
            "WantedSemester is CurrentSemester+1, "+
            "getNextDECourse(StudentID,DECourse), "+
            "getNextENGCourse(StudentID,ENGCourse), "+
            "append(DECourse,ENGCourse,LangCourses), "+
            "soFarCourses(CurrentSemester,AllPastCourses), "+
            "studentPassedCourses(StudentID,PassedCourses), "+
            "subtract(AllPastCourses,PassedCourses,NotTakenOrFailedCourses), "+
            "cs_semester_courses(WantedSemester,SemCourses), "+
            "append(NotTakenOrFailedCourses,SemCourses,PossibleCourses), "+
            "cannotTake(StudentID,CantTakeCourses), "+
            "subtract(PossibleCourses,CantTakeCourses,AllowedCourses), "+
            "filterSameSemesterCategory(AllowedCourses,WantedSemester,AllowedFilteredCourses), "+
            "addCSCourses(StudentID,LangCourses,AllowedFilteredCourses,Courses). "+

      "getScheduleHelper(StudentID,Courses):- "+
            "student(StudentID,_,cs,CurrentSemester,_), "+
            "WantedSemester is CurrentSemester+1, "+
            "getNextDECourse(StudentID,DECourse), "+
            "getNextENGCourse(StudentID,ENGCourse), "+
            "append(DECourse,ENGCourse,LangCourses), "+
            "soFarCourses(CurrentSemester,AllPastCourses), "+
            "studentPassedCourses(StudentID,PassedCourses), "+
            "subtract(AllPastCourses,PassedCourses,NotTakenOrFailedCourses), "+
            "cs_semester_courses(WantedSemester,SemCourses), "+
            "append(NotTakenOrFailedCourses,SemCourses,PossibleCourses), "+
            "\\+cannotTake(StudentID,_), "+
            "filterSameSemesterCategory(PossibleCourses,WantedSemester,PossibleFilteredCourses), "+
            "addCSCourses(StudentID,LangCourses,PossibleFilteredCourses,Courses). "+

      */
      /*--- getSchedule2() ---*/

      "getSchedules(StudentID,Schedules):-"+
            "setof([X,Y],getSchedule2(StudentID,X,Y),Schedules). "+

      "getSchedule2(StudentID,Courses,ExtraHours):- "+
            "getSchedule2Helper(StudentID,Courses,ExtraHours). "+

      "getSchedule2Helper(StudentID,Courses,ExtraHours):-"+
            "student(StudentID,_,cs,CurrentSemester,_),"+
            "getMaxHours(StudentID,Semester,TotalAllowedCH),"+
            "WantedSemester is CurrentSemester+1,"+
            "getNextDECourse(StudentID,DECourse),"+
            "getNextENGCourse(StudentID,ENGCourse),"+
            "append(DECourse,ENGCourse,LangCourses),"+
            "cs_collective_credithours(LangCourses,LangCH),"+
            "NetTotalAllowedCH is TotalAllowedCH - LangCH,"+ /* step 1 done */
            "soFarCourses(CurrentSemester,AllPastCourses),"+
            "studentPassedCourses(StudentID,PassedCourses),"+
            "subtract(AllPastCourses,PassedCourses,NotTakenOrFailedCourses),"+
            "cannotTake(StudentID,CantTakeCourses),"+
            "subtract(NotTakenOrFailedCourses,CantTakeCourses,AllowedPastCourses),"+
            "filterSameSemesterCategory(AllowedPastCourses,WantedSemester,SemesterFilteredCourses),"+
            "cs_collective_credithours(SemesterFilteredCourses,PastCSCH),"+ /* step 2 done */
            "NetTotalAllowedCH > PastCSCH,"+
            "append(LangCourses, SemesterFilteredCourses,LangAndPastCourses),"+
            "LeftTotalAllowedCH is NetTotalAllowedCH - PastCSCH,"+
            "cs_semester_courses(WantedSemester,SemCourses),"+
            "subtract(SemCourses,CantTakeCourses,AllowedSemesterCourses),"+
            "cs_collective_credithours(AllowedSemesterCourses,SemCSCH),"+
            "LeftTotalAllowedCH < SemCSCH,"+
            "multipleSchedules(LangAndPastCourses,AllowedSemesterCourses,LeftTotalAllowedCH,Courses),"+
            "cs_collective_credithours(Courses,WithExtraHours),"+
            "cs_semester(Semester,NormalHours),"+
            "ExtraHours is WithExtraHours - NormalHours."+

      "getSchedule2Helper(StudentID,Courses,ExtraHours):-"+
            "student(StudentID,_,cs,CurrentSemester,_),"+
            "getMaxHours(StudentID,Semester,TotalAllowedCH),"+
            "WantedSemester is CurrentSemester+1,"+
            "getNextDECourse(StudentID,DECourse),"+
            "getNextENGCourse(StudentID,ENGCourse),"+
            "append(DECourse,ENGCourse,LangCourses),"+
            "cs_collective_credithours(LangCourses,LangCH),"+
            "NetTotalAllowedCH is TotalAllowedCH - LangCH,"+ /* step 1 done */
            "soFarCourses(CurrentSemester,AllPastCourses),"+
            "studentPassedCourses(StudentID,PassedCourses),"+
            "subtract(AllPastCourses,PassedCourses,NotTakenOrFailedCourses),"+
            "cannotTake(StudentID,CantTakeCourses),"+
            "subtract(NotTakenOrFailedCourses,CantTakeCourses,AllowedPastCourses),"+
            "filterSameSemesterCategory(AllowedPastCourses,WantedSemester,SemesterFilteredCourses),"+
            "cs_collective_credithours(SemesterFilteredCourses,PastCSCH),"+ /* step 2 done */
            "NetTotalAllowedCH > PastCSCH,"+
            "append(LangCourses, SemesterFilteredCourses,LangAndPastCourses),"+
            "LeftTotalAllowedCH is NetTotalAllowedCH - PastCSCH,"+
            "cs_semester_courses(WantedSemester,SemCourses),"+
            "subtract(SemCourses,CantTakeCourses,AllowedSemesterCourses),"+
            "cs_collective_credithours(AllowedSemesterCourses,SemCSCH),"+
            "LeftTotalAllowedCH >= SemCSCH,"+
            "append(LangAndPastCourses,AllowedSemesterCourses,Courses),"+
            "cs_collective_credithours(Courses,WithExtraHours),"+
            "cs_semester(Semester,NormalHours),"+
            "ExtraHours is WithExtraHours - NormalHours."+

      "getSchedule2Helper(StudentID,Courses,ExtraHours):-"+
            "student(StudentID,_,cs,CurrentSemester,_),"+
            "getMaxHours(StudentID,Semester,TotalAllowedCH),"+
            "WantedSemester is CurrentSemester+1,"+
            "getNextDECourse(StudentID,DECourse),"+
            "getNextENGCourse(StudentID,ENGCourse),"+
            "append(DECourse,ENGCourse,LangCourses),"+
            "cs_collective_credithours(LangCourses,LangCH),"+
            "NetTotalAllowedCH is TotalAllowedCH - LangCH,"+ /* step 1 done */
            "soFarCourses(CurrentSemester,AllPastCourses),"+
            "studentPassedCourses(StudentID,PassedCourses),"+
            "subtract(AllPastCourses,PassedCourses,NotTakenOrFailedCourses),"+
            "cannotTake(StudentID,CantTakeCourses),"+
            "subtract(NotTakenOrFailedCourses,CantTakeCourses,AllowedPastCourses),"+ /* step 2 done */
            "filterSameSemesterCategory(AllowedPastCourses,WantedSemester,SemesterFilteredCourses),"+
            "cs_collective_credithours(SemesterFilteredCourses,PastCSCH),"+
            "NetTotalAllowedCH = PastCSCH,"+
            "append(LangCourses,SemesterFilteredCourses,Courses),"+
            "cs_collective_credithours(Courses,WithExtraHours),"+
            "cs_semester(Semester,NormalHours),"+
            "ExtraHours is WithExtraHours - NormalHours."+

      "getSchedule2Helper(StudentID,Courses,ExtraHours):-"+
            "student(StudentID,_,cs,CurrentSemester,_),"+
            "getMaxHours(StudentID,Semester,TotalAllowedCH),"+
            "WantedSemester is CurrentSemester+1,"+
            "getNextDECourse(StudentID,DECourse),"+
            "getNextENGCourse(StudentID,ENGCourse),"+
            "append(DECourse,ENGCourse,LangCourses),"+
            "cs_collective_credithours(LangCourses,LangCH),"+
            "NetTotalAllowedCH is TotalAllowedCH - LangCH,"+ /* step 1 done */
            "soFarCourses(CurrentSemester,AllPastCourses),"+
            "studentPassedCourses(StudentID,PassedCourses),"+
            "subtract(AllPastCourses,PassedCourses,NotTakenOrFailedCourses),"+
            "cannotTake(StudentID,CantTakeCourses),"+
            "subtract(NotTakenOrFailedCourses,CantTakeCourses,AllowedPastCourses),"+ /* step 2 done */
            "filterSameSemesterCategory(AllowedPastCourses,WantedSemester,SemesterFilteredCourses),"+
            "cs_collective_credithours(SemesterFilteredCourses,PastCSCH),"+
            "NetTotalAllowedCH < PastCSCH,"+
            "multipleSchedules(LangCourses,SemesterFilteredCourses,NetTotalAllowedCH,Courses),"+
            "cs_collective_credithours(Courses,WithExtraHours),"+
            "cs_semester(Semester,NormalHours),"+
            "ExtraHours is WithExtraHours - NormalHours."+

      "getSchedule2Helper(StudentID,Courses,ExtraHours):-"+ /* student has no failed courses */
            "student(StudentID,_,cs,CurrentSemester,_),"+
            "getMaxHours(StudentID,Semester,TotalAllowedCH),"+
            "WantedSemester is CurrentSemester+1,"+
            "getNextDECourse(StudentID,DECourse),"+
            "getNextENGCourse(StudentID,ENGCourse),"+
            "append(DECourse,ENGCourse,LangCourses),"+
            "cs_collective_credithours(LangCourses,LangCH),"+
            "NetTotalAllowedCH is TotalAllowedCH - LangCH,"+ /* step 1 done */
            "soFarCourses(CurrentSemester,AllPastCourses),"+
            "studentPassedCourses(StudentID,PassedCourses),"+
            "subtract(AllPastCourses,PassedCourses,AllowedPastCourses),"+
            "\+cannotTake(StudentID,_),"+ /* step 2 done for student without cannotTakeCourses*/
            "filterSameSemesterCategory(AllowedPastCourses,WantedSemester,FilteredPastCourses),"+
            "cs_collective_credithours(FilteredPastCourses,PastCSCH),"+
            "NetTotalAllowedCH = PastCSCH,"+
            "append(LangCourses,FilteredPastCourses,Courses),"+
            "cs_collective_credithours(Courses,WithExtraHours),"+
            "cs_semester(Semester,NormalHours),"+
            "ExtraHours is WithExtraHours - NormalHours."+

      "getSchedule2Helper(StudentID,Courses,ExtraHours):-"+ /* student has no failed courses */
            "student(StudentID,_,cs,CurrentSemester,_),"+
            "getMaxHours(StudentID,Semester,TotalAllowedCH),"+
            "WantedSemester is CurrentSemester+1,"+
            "getNextDECourse(StudentID,DECourse),"+
            "getNextENGCourse(StudentID,ENGCourse),"+
            "append(DECourse,ENGCourse,LangCourses),"+
            "cs_collective_credithours(LangCourses,LangCH),"+
            "NetTotalAllowedCH is TotalAllowedCH - LangCH,"+ /* step 1 done */
            "soFarCourses(CurrentSemester,AllPastCourses),"+
            "studentPassedCourses(StudentID,PassedCourses),"+
            "subtract(AllPastCourses,PassedCourses,AllowedPastCourses),"+
            "\+cannotTake(StudentID,_),"+ /* step 2 done for student without cannotTakeCourses*/
            "filterSameSemesterCategory(AllowedPastCourses,WantedSemester,FilteredPastCourses),"+
            "cs_collective_credithours(FilteredPastCourses,PastCSCH),"+
            "NetTotalAllowedCH < PastCSCH,"+
            "multipleSchedules(LangCourses,FilteredPastCourses,NetTotalAllowedCH,Courses),"+
            "cs_collective_credithours(Courses,WithExtraHours),"+
            "cs_semester(Semester,NormalHours),"+
            "ExtraHours is WithExtraHours - NormalHours."+

      "getSchedule2Helper(StudentID,Courses,ExtraHours):-"+ /* student has no failed courses */
            "student(StudentID,_,cs,CurrentSemester,_),"+
            "getMaxHours(StudentID,Semester,TotalAllowedCH),"+
            "WantedSemester is CurrentSemester+1,"+
            "getNextDECourse(StudentID,DECourse),"+
            "getNextENGCourse(StudentID,ENGCourse),"+
            "append(DECourse,ENGCourse,LangCourses),"+
            "cs_collective_credithours(LangCourses,LangCH),"+
            "NetTotalAllowedCH is TotalAllowedCH - LangCH,"+ /* step 1 done */
            "soFarCourses(CurrentSemester,AllPastCourses),"+
            "studentPassedCourses(StudentID,PassedCourses),"+
            "subtract(AllPastCourses,PassedCourses,AllowedPastCourses),"+
            "\+cannotTake(StudentID,_),"+
            "filterSameSemesterCategory(AllowedPastCourses,WantedSemester,SemesterFilteredCourses),"+
            "cs_collective_credithours(SemesterFilteredCourses,PastCSCH),"+ /* step 2 done for student without cannotTakeCourses*/
            "NetTotalAllowedCH > PastCSCH,"+
            "append(LangCourses, SemesterFilteredCourses,LangAndPastCourses),"+
            "LeftTotalAllowedCH is NetTotalAllowedCH - PastCSCH,"+
            "cs_semester_courses(WantedSemester,AllowedSemesterCourses),"+
            "cs_collective_credithours(AllowedSemesterCourses,SemCSCH),"+ /* step 3 done without cannotTakeCourses*/
            "LeftTotalAllowedCH < SemCSCH,"+
            "multipleSchedules(LangAndPastCourses,AllowedSemesterCourses,LeftTotalAllowedCH,Courses),"+
            "cs_collective_credithours(Courses,WithExtraHours),"+
            "cs_semester(Semester,NormalHours),"+
            "ExtraHours is WithExtraHours - NormalHours."+

      "getSchedule2Helper(StudentID,Courses,ExtraHours):-"+ /* student has no failed courses */
            "student(StudentID,_,cs,CurrentSemester,_),"+
            "getMaxHours(StudentID,Semester,TotalAllowedCH),"+
            "WantedSemester is CurrentSemester+1,"+
            "getNextDECourse(StudentID,DECourse),"+
            "getNextENGCourse(StudentID,ENGCourse),"+
            "append(DECourse,ENGCourse,LangCourses),"+
            "cs_collective_credithours(LangCourses,LangCH),"+
            "NetTotalAllowedCH is TotalAllowedCH - LangCH,"+ /* step 1 done */
            "soFarCourses(CurrentSemester,AllPastCourses),"+
            "studentPassedCourses(StudentID,PassedCourses),"+
            "subtract(AllPastCourses,PassedCourses,AllowedPastCourses),"+
            "\+cannotTake(StudentID,_),"+
            "filterSameSemesterCategory(AllowedPastCourses,WantedSemester,SemesterFilteredCourses),"+
            "cs_collective_credithours(SemesterFilteredCourses,PastCSCH),"+ /* step 2 done for student without cannotTakeCourses*/
            "NetTotalAllowedCH > PastCSCH,"+
            "append(LangCourses, SemesterFilteredCourses,LangAndPastCourses),"+
            "LeftTotalAllowedCH is NetTotalAllowedCH - PastCSCH,"+
            "cs_semester_courses(WantedSemester,AllowedSemesterCourses),"+
            "cs_collective_credithours(AllowedSemesterCourses,SemCSCH),"+ /* step 3 done without cannotTakeCourses*/
            "LeftTotalAllowedCH >= SemCSCH,"+
            "append(LangAndPastCourses,AllowedSemesterCourses,Courses),"+
            "cs_collective_credithours(Courses,WithExtraHours),"+
            "cs_semester(Semester,NormalHours),"+
            "ExtraHours is WithExtraHours - NormalHours."+

      "multipleSchedules(LangAndPastCourses,AllowedSemesterCourses,LeftTotalAllowedCH,Courses):-"+
            "sum_of(AllowedSemesterCourses,LeftTotalAllowedCH,Results),"+
            "append(LangAndPastCourses,Results,Courses)."+


      "sum_of(List,MaxCH,Res):-"+
            "sum_helper(List,MaxCH,[],[],Res)."+

      "sum_helper([],MaxCH,Unused,Acc,Acc):-"+
            "cs_collective_credithours(Acc,CH),"+
            "CH=<MaxCH,"+
            "cannotAddMore(Acc,MaxCH,Unused)."+

      "sum_helper([H|T],MaxCH,Unused,Acc,Res):-"+
            "cs_collective_credithours(Acc,SumSoFar),"+
            "SumSoFar=<MaxCH,"+
            "append(Acc,[H],NewAcc),"+
            "sum_helper(T,MaxCH,Unused,NewAcc,Res)."+

      "sum_helper([H|T],MaxCH,Unused,Acc,Res):-"+
            "cs_collective_credithours(Acc,CHSumSoFar),"+
            "CHSumSoFar=<MaxCH,"+
            "append(Unused,[H],Unused2),"+
            "sum_helper(T,MaxCH,Unused2,Acc,Res)."+

	"cannotAddMore(_,_,[])."+

	"cannotAddMore(Acc,MaxCH,[H|T]):-"+
            "append(Acc,[H],Temp),"+
            "cs_collective_credithours(Temp,CH),"+
            "CH>MaxCH,"+
            "cannotAddMore(Acc,MaxCH,T)."+

      /*--- addCSCourses ---*/
      /*
      "addCSCourses(_,List,[],List). "+

      "addCSCourses(StudentID,List,[Course|T2],Courses):- "+ 
            "cs_collective_credithours(List,TotalCH), "+
            "cs_course(Course,_,CH), "+
            "Temp is TotalCH+CH, "+
            "getMaxHours(StudentID,MaxHours), "+ 
            "Temp>MaxHours, "+
            "addCSCourses(StudentID,List,T2,Courses). "+

      "addCSCourses(StudentID,List,[Course|T2],Courses):- "+
            "cs_course(Course,_,CH), "+
            "cs_collective_credithours(List,TotalCH), "+
            "Temp is TotalCH+CH, "+
            "getMaxHours(StudentID,MaxHours), "+
            "Temp=<MaxHours, "+
            "addCSCourses(StudentID,[Course|List],T2,Courses). "+

      */
      /*--- isSameSemesterCategory ---*/

      "isSameSemesterCategory(CourseSemesterNumber,CurrentSemesterNumber,1):- "+
            "member(CourseSemesterNumber,[2,4,6,8,10]), "+
            "member(CurrentSemesterNumber,[2,4,6,8,10]). "+

      "isSameSemesterCategory(CourseSemesterNumber,CurrentSemesterNumber,1):- "+
            "member(CourseSemesterNumber,[1,3,5,7,9]), "+
            "member(CurrentSemesterNumber,[1,3,5,7,9]). "+

      /*--- filterSameSemesterCategory ---*/

      "filterSameSemesterCategory([],_,[]). "+

      "filterSameSemesterCategory([H|T],SemesterNumber,[H|O]):- "+
            "cs_course(H,CourseSemesterNumber,_), "+
            "isSameSemesterCategory(SemesterNumber,CourseSemesterNumber,1), "+
            "filterSameSemesterCategory(T,SemesterNumber,O). "+

      "filterSameSemesterCategory([H|T],SemesterNumber,O):- "+
            "cs_course(H,CourseSemesterNumber,_), "+
            "\\+isSameSemesterCategory(SemesterNumber,CourseSemesterNumber,1), "+
            "filterSameSemesterCategory(T,SemesterNumber,O). "+

      /*--- getMaxHours ---*/

      "getMaxHours(StudentID,Semester,SemesterHours):- "+ // probation students get no extra credit hours
            "student(StudentID,_,cs,_,StudentGPA), "+
            "StudentGPA>3.7, "+
            "belongingCHSemester(StudentID,Semester),"+
            "cs_semester(Semester,SH), "+
            "SemesterHours is SH*0.75."+
            
      "getMaxHours(StudentID,Semester,SemesterHours):- "+ 
            "student(StudentID,_,cs,_,StudentGPA), "+
            "StudentGPA=<3.7, "+
            "belongingCHSemester(StudentID,Semester),"+
            "cs_semester(Semester,SemesterHours), "+
            "SemesterHours>=34. "+

      "getMaxHours(StudentID,Semester,34):- "+
            "student(StudentID,_,cs,_,StudentGPA), "+
            "StudentGPA=<3.7, "+
            "belongingCHSemester(StudentID,Semester),"+
            "cs_semester(Semester,SemesterHours), "+
            "Temp is SemesterHours+3, "+
            "SemesterHours<34,"+
            "Temp>34. "+

      "getMaxHours(StudentID,Semester,TotalHours):- "+
            "student(StudentID,_,cs,_,StudentGPA), "+
            "StudentGPA=<3.7, "+
            "belongingCHSemester(StudentID,Semester),"+
            "cs_semester(Semester,SemesterHours), "+
            "TotalHours is SemesterHours+3, "+
            "TotalHours=<34. "+

      /*--- belongingCHSemester ---*/

      "belongingCHSemester(StudentID,Semester):-"+
            "studentPassedCourses(StudentID,PassedCourses),"+
            "cs_collective_credithours(PassedCourses,CH),"+
            "getSemester(CH,1,36,[28,37,34,28,24,24,18,20,26],Semester)."+

      /*--- getSemester ---*/

      "getSemester(CH,AccumSem,AccumSemSum,_,AccumSem):-"+
            "CH<AccumSemSum."+

      "getSemester(CH,AccumSem,AccumSemSum,_,Semester):- "+ /* Normal Semester */
            "CH=AccumSemSum,"+
            "Semester is AccumSem+1."+

      "getSemester(CH,AccumSem,AccumSemSum,[H|T],Semester):-"+
            "CH>AccumSemSum,"+
            "A is AccumSem+1,"+
            "B is AccumSemSum+H,"+
            "getSemester(CH,A,B,T,Semester)."+

      /*--- soFarCourses ---*/

      "soFarCourses(0,[]). "+

      "soFarCourses(Semester,Courses):- "+
            "cs_semester_courses(Semester,SemesterCourses), "+
            "NextSemester is Semester-1, "+
            "soFarCourses(NextSemester,OtherCourses), "+
            "append(OtherCourses,SemesterCourses,Courses). "+

      /*--- getNextDECourse ---*/

      "getNextDECourse(StudentID,CourseCode):- "+
            "studentPassedCourses(StudentID,Courses), "+
            "filterLangCourses(de,Courses,DECoursesTaken), "+
            "highestLangCourse(de,DECoursesTaken,HighestDETaken), "+
            "filterTill(de,HighestDETaken,[de101,de202,de303,de404],LeftDECourses), "+
            "getLangHead(LeftDECourses,CourseCode). "+

      "getNextDECourse(StudentID,[de101]):- "+
            "studentPassedCourses(StudentID,Courses), "+
            "filterLangCourses(de,Courses,[]). "+

      /*--- getNextENGCourse ---*/

      "getNextENGCourse(StudentID,CourseCode):- "+
            "studentPassedCourses(StudentID,Courses), "+
            "filterLangCourses(eng,Courses,ENGCoursesTaken), "+
            "highestLangCourse(eng,ENGCoursesTaken,HighestENGTaken), "+
            "filterTill(eng,HighestENGTaken,[ae101,as102,sm101,cps402,rpw401],LeftENGCourses), "+
            "getLangHead(LeftENGCourses,CourseCode). "+

      "getNextENGCourse(StudentID,[ae101]):- "+
            "studentPassedCourses(StudentID,Courses), "+
            "filterLangCourses(eng,Courses,[]). "+

      /*--- getLangHead ---*/

      "getLangHead([],[]). "+

      "getLangHead([H|_],[H]):- "+
            "lang_course(_,_,H,_). "+

      /*--- filterLangCourses ---*/

      "filterLangCourses(_,[],[]). "+

      "filterLangCourses(Lang,[H|T],[H|TT]):- "+
            "lang_course(Lang,_,H,_), "+
            "filterLangCourses(Lang,T,TT). "+

      "filterLangCourses(Lang,[H|T],TT):- "+
            "\\+lang_course(Lang,_,H,_), "+
            "filterLangCourses(Lang,T,TT). "+

      /*--- highestLangCourse ---*/

      "highestLangCourse(Lang,[H|T],HighestLangCourse):- "+
            "highestLangHelper(Lang,T,H,HighestLangCourse). "+

      "highestLangHelper(_,[],X,X). "+

      "highestLangHelper(Lang,[H|T],HighestSoFar,HighestLangCourse):- "+
            "lang_course(Lang,ThisLevel,H,_), "+
            "lang_course(Lang,Level,HighestSoFar,_), "+
            "ThisLevel>Level, "+
            "highestLangHelper(Lang,T,H,HighestLangCourse). "+

      "highestLangHelper(Lang,[H|T],HighestSoFar,HighestLangCourse):- "+
            "lang_course(Lang,ThisLevel,H,_), "+
            "lang_course(Lang,ThisLevel,H,_), "+
            "lang_course(Lang,Level,HighestSoFar,_), "+
            "ThisLevel<Level, "+
            "highestLangHelper(Lang,T,HighestSoFar,HighestLangCourse). "+

      /*--- filterTill ---*/

      "filterTill(_,_,[],[]). "+

      "filterTill(_,[],_,[]). "+

      "filterTill(Lang,HighestTakenCourse,[H|T],[H|TT]):- "+
            "lang_course(Lang,ThisLevel,H,_), "+
            "lang_course(Lang,Level,HighestTakenCourse,_), "+
            "ThisLevel>Level, "+
            "filterTill(Lang,HighestTakenCourse,T,TT). "+

      "filterTill(Lang,HighestTakenCourse,[H|T],TT):- "+
            "lang_course(Lang,ThisLevel,H,_), "+
            "lang_course(Lang,Level,HighestTakenCourse,_), "+
            "ThisLevel=<Level, "+
            "filterTill(Lang,HighestTakenCourse,T,TT). "+

      "\n\n failed_course(123,csen102,o).";      
      

var transcript = `student(43-7148,nada,cs,5,3).

passed_course(43-7148,cps402).
passed_course(43-7148,as102).
passed_course(43-7148,ae101).
passed_course(43-7148,sm101).
passed_course(43-7148,chemp102).
passed_course(43-7148,chemt102).
passed_course(43-7148,engd301).
passed_course(43-7148,csen102).
passed_course(43-7148,math103).
passed_course(43-7148,phys101).
passed_course(43-7148,csen202).
passed_course(43-7148,math203).
passed_course(43-7148,phys202).
passed_course(43-7148,edpt201).
passed_course(43-7148,csen301).
passed_course(43-7148,elct301).
passed_course(43-7148,math301).
passed_course(43-7148,physp301).
passed_course(43-7148,physt301).
passed_course(43-7148,csis402).
passed_course(43-7148,csen401).
passed_course(43-7148,csen403).
failed_course(43-7148,elct401,o).
failed_course(43-7148,math401,o).
failed_course(43-7148,comm401,o).
failed_course(43-7148,csen501,o).
failed_course(43-7148,csen605,a).
failed_course(43-7148,csen503,a).
failed_course(43-7148,dmet501,a).
failed_course(43-7148,math501,a).
failed_course(43-7148,csen502,o).
failed_course(43-7148,elct201,o).
failed_course(43-7148,rpw401,a).
failed_course(43-7148,de202,a).`;

session.consult(program+transcript);

// Query the goal
session.query("getSchedule(43-7148,Schedules,ExtraHours).");

// Show answers
//session.answers(x => console.log(pl.format_answer(x)));



var myArray = "";

session.answers(x => { // Show answers
    let str = pl.format_answer(x);
    let temp1 = str.split("[");
    if(temp1[0].substring(0,1)=='S'){
          let temp2 = temp1[1].split("]");
          let schedule = temp2[0];
          temp1 = temp2[1].split("= ");
          temp2 = temp1[1].split(" ;");
          let extraHours = temp2[0];
          if(extraHours>0){
            myArray += "schedule is ["+schedule+"] with "+extraHours+" extra credit hours";
            console.log("schedule is ["+schedule+"] with "+extraHours+" extra credit hours");
          }else{
            myArray += "schedule is ["+schedule+"] with no extra credit hours";
            console.log("schedule is ["+schedule+"] with no extra credit hours");
          }  
    }
    
});

console.log("outside answer ==> "+myArray);







  