

function executeQuery(thisQuery) {

  var pl = require("tau-prolog"); // Import Tau Prolog core
  
  require("tau-prolog/modules/lists")(pl); // Import and apply the lists module

  var session = pl.create(1000); // Create a session

  var program = // Load the program
    
        ":- use_module(library(lists))." + // Load the lists module

        "subtract([], _, []). "+
        "subtract([Head|Tail], L2, L3) :- memberchk(Head, L2), !, subtract(Tail, L2, L3). "+
        "subtract([Head|Tail1], L2, [Head|Tail3]) :- subtract(Tail1, L2, Tail3). "+

        "memberchk(X,[X|_]) :- !. "+ 
        "memberchk(X,[_|T]):- memberchk(X,T). "+

        "cs_semester(1,36)."+ /* 38/36 */
        "cs_semester(2,28)."+ /* 30/28 */
        "cs_semester(3,37)."+
        "cs_semester(4,34)."+
        "cs_semester(5,28)."+ /* 28/30 */
        "cs_semester(6,24)."+
        "cs_semester(7,24)."+

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

        "cs_course(huma1001,10,4)."+
        "cs_course(csen1001,10,4)."+
        "cs_course(csen1002,10,4)."+
        "cs_course(csen1003,10,4)."+

        "cs_semester_courses(SemesterNum,Courses):- setof(X,Y^cs_course(X,SemesterNum,Y),Courses)."+

        "cs_collective_credithours([],0)."+
        "cs_collective_credithours([H|T],CH):- cs_course(H,_,X), cs_collective_credithours(T,X1), CH is X+X1."+

        "cs_collective_credithours([H|T],CH):- lang_course(_,_,H,X), cs_collective_credithours(T,X1), CH is X+X1."+

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

        "student(43-1293,ahmed,cs,5)."+
        "student(43-4861,marwan,cs,5)."+
        "student(43-7148,nada,cs,5)."+
        "student(46-5295,mostafa,cs,3)."+

        "passed_course(43-1293,csen102)."+
        "passed_course(43-1293,math103)."+
        "passed_course(43-1293,chemp102)."+
        "passed_course(43-1293,chemt102)."+
        "passed_course(43-1293,phys101)."+
        "passed_course(43-1293,engd301)."+

        "passed_course(43-1293,phys202)."+
        "passed_course(43-1293,csen202)."+
        "passed_course(43-1293,edpt201)."+
        
        "passed_course(43-1293,physp301)."+
        "passed_course(43-1293,physt301)."+
        "passed_course(43-1293,elct301)."+
        "passed_course(43-1293,csen301)."+

        "passed_course(43-1293,math401)."+
        "passed_course(43-1293,csen401)."+
        "passed_course(43-1293,comm401)."+
        "passed_course(43-1293,csen403)."+
        
        "passed_course(43-1293,math501)."+
        "passed_course(43-1293,dmet501)."+
        "passed_course(43-1293,csen501)."+
        "passed_course(43-1293,csen503)."+
        "passed_course(43-1293,csen605)."+
        "passed_course(43-1293,csen502)."+

        "passed_course(43-4861,csen102)."+
        "passed_course(43-4861,math103)."+
        "passed_course(43-4861,chemp102)."+
        "passed_course(43-4861,chemt102)."+
        "passed_course(43-4861,phys101)."+
        "passed_course(43-4861,engd301)."+

        "passed_course(43-4861,phys202)."+
        "passed_course(43-4861,math203)."+
        "passed_course(43-4861,csen202)."+
        "passed_course(43-4861,elct201)."+
        "passed_course(43-4861,edpt201)."+

        "passed_course(43-4861,math301)."+
        "passed_course(43-4861,physp301)."+
        "passed_course(43-4861,physt301)."+
        "passed_course(43-4861,elct301)."+
        "passed_course(43-4861,csen301)."+
        
        "passed_course(43-4861,csis402)."+
        "passed_course(43-4861,csen401)."+
        "passed_course(43-4861,csen403)."+

        "passed_course(43-4861,math501)."+
        "passed_course(43-4861,dmet501)."+
        "passed_course(43-4861,csen501)."+
        "passed_course(43-4861,csen503)."+
        "passed_course(43-4861,csen605)."+
        "passed_course(43-4861,csen502)."+

        "passed_course(43-7148,cps402)."+
        "passed_course(43-7148,as102)."+
        "passed_course(43-7148,ae101)."+
        "passed_course(43-7148,sm101)."+

        "passed_course(43-7148,csen102)."+
        "passed_course(43-7148,math103)."+
        "passed_course(43-7148,chemp102)."+
        "passed_course(43-7148,chemt102)."+
        "passed_course(43-7148,phys101)."+
        "passed_course(43-7148,engd301)."+

        "passed_course(43-7148,math203)."+
        "passed_course(43-7148,phys202)."+
        "passed_course(43-7148,csen202)."+
        "passed_course(43-7148,edpt201)."+

        "passed_course(43-7148,math301)."+
        "passed_course(43-7148,physp301)."+
        "passed_course(43-7148,physt301)."+
        "passed_course(43-7148,elct301)."+
        "passed_course(43-7148,csen301)."+

        "passed_course(43-7148,csen403)."+
        "passed_course(43-7148,csis402)."+
        "passed_course(43-7148,csen401)."+

        "passed_course(46-5295,de303)."+
        "passed_course(46-5295,cps402)."+
        "passed_course(46-5295,as102)."+
        "passed_course(46-5295,sm101)."+
        "passed_course(46-5295,chemp102)."+
        "passed_course(46-5295,chemt102)."+
        "passed_course(46-5295,engd301)."+
        "passed_course(46-5295,csen102)."+
        "passed_course(46-5295,math103)."+
        "passed_course(46-5295,phys101)."+
        "passed_course(46-5295,phys202)."+
        "passed_course(46-5295,edpt201)."+
        "passed_course(46-5295,csen301)."+
        "passed_course(46-5295,elct201)."+
        "passed_course(46-5295,elct301)."+
        "passed_course(46-5295,physp301)."+
        "passed_course(46-5295,physt301)."+


        /*a=attendance,o=other */
        "failed_course(43-1293,elct201,o)."+
        "failed_course(43-1293,math203,o)."+
        "failed_course(43-1293,math301,o)."+
        "failed_course(43-1293,elct401,o)."+
        "failed_course(43-1293,csis402,o)."+
        "failed_course(43-1293,csen403,o)."+
        "failed_course(43-1293,dmet501,o). "+
        "failed_course(43-1293,de202,o). "+

        "failed_course(43-7148,elct201,o). "+
        "failed_course(43-7148,elct401,o). "+
        "failed_course(43-7148,comm401,o). "+
        "failed_course(43-7148,math401,o). "+
        "failed_course(43-7148,math501,a). "+
        "failed_course(43-7148,dmet501,a). "+
        "failed_course(43-7148,csen501,o). "+
        "failed_course(43-7148,csen503,a). "+
        "failed_course(43-7148,csen605,a). "+
        "failed_course(43-7148,csen502,o). "+
        "failed_course(43-7148,rpw401,a). "+
        "failed_course(43-7148,de202,a). "+

        "failed_course(46-5295,math203,a). "+
        "failed_course(46-5295,csen202,o). "+

        /*--- cannotTake ---*/

        "cannotTake(StudentID, Courses):- setof(X,cannot_take_helper(StudentID,X),Courses). "+

        "cannot_take_helper(StudentID, CourseCode):- failed_course(StudentID,OtherCourseCode,a), prereq(CourseCode,OtherCourseCode). "+

        /*--- studentPassedCourses ---*/

        "studentPassedCourses(StudentID,Courses):- setof(X,passed_course(StudentID,X),Courses). "+

        /*--- studentFailedCourses ---*/

        "studentFailedCourses(StudentID,Courses):- setof(X,Y^failed_course(StudentID,X,Y),Courses). "+

        /*--- getSchedule ---*/

        "getSchedule(StudentID,Courses):- getScheduleHelper(StudentID,Courses). "+

        "getScheduleHelper(StudentID,Courses):- student(StudentID,_,cs,CurrentSemester), WantedSemester is CurrentSemester+1, getNextDECourse(StudentID,DECourse), getNextENGCourse(StudentID,ENGCourse), append(DECourse,ENGCourse,LangCourses), soFarCourses(CurrentSemester,AllPastCourses), studentPassedCourses(StudentID,PassedCourses), subtract(AllPastCourses,PassedCourses,NotTakenOrFailedCourses), cs_semester_courses(WantedSemester,SemCourses), append(NotTakenOrFailedCourses,SemCourses,PossibleCourses), cannotTake(StudentID,CantTakeCourses), subtract(PossibleCourses,CantTakeCourses,AllowedCourses), filterSameSemesterCategory(AllowedCourses,WantedSemester,AllowedFilteredCourses), addCSCourses(LangCourses,AllowedFilteredCourses,WantedSemester,Courses). "+

        "getScheduleHelper(StudentID,Courses):- student(StudentID,_,cs,CurrentSemester), WantedSemester is CurrentSemester+1, getNextDECourse(StudentID,DECourse), getNextENGCourse(StudentID,ENGCourse), append(DECourse,ENGCourse,LangCourses), soFarCourses(CurrentSemester,AllPastCourses), studentPassedCourses(StudentID,PassedCourses), subtract(AllPastCourses,PassedCourses,NotTakenOrFailedCourses), cs_semester_courses(WantedSemester,SemCourses), append(NotTakenOrFailedCourses,SemCourses,PossibleCourses), \\+cannotTake(StudentID,_), filterSameSemesterCategory(PossibleCourses,WantedSemester,PossibleFilteredCourses), addCSCourses(LangCourses,PossibleFilteredCourses,WantedSemester,Courses). "+

        /*--- addCSCourses ---*/

        "addCSCourses(List,[],_,List). "+

        "addCSCourses(List,[Course|T2],StudentSemester,Courses):- cs_collective_credithours(List,TotalCH), cs_course(Course,_,CH), Temp is TotalCH+CH, getMaxHours(StudentSemester,MaxHours), Temp>MaxHours, addCSCourses(List,T2,StudentSemester,Courses). "+

        "addCSCourses(List,[Course|T2],StudentSemester,Courses):- cs_course(Course,_,CH), cs_collective_credithours(List,TotalCH), Temp is TotalCH+CH, getMaxHours(StudentSemester,MaxHours), Temp=<MaxHours, addCSCourses([Course|List],T2,StudentSemester,Courses). "+

        /*--- isSameSemesterCategory ---*/

        "isSameSemesterCategory(CourseSemesterNumber,CurrentSemesterNumber,1):- member(CourseSemesterNumber,[2,4,6,8,10]), member(CurrentSemesterNumber,[2,4,6,8,10]). "+

        "isSameSemesterCategory(CourseSemesterNumber,CurrentSemesterNumber,1):- member(CourseSemesterNumber,[1,3,5,7,9]), member(CurrentSemesterNumber,[1,3,5,7,9]). "+

        /*--- filterSameSemesterCategory ---*/

        "filterSameSemesterCategory([],_,[]). "+

        "filterSameSemesterCategory([H|T],SemesterNumber,[H|O]):- cs_course(H,CourseSemesterNumber,_), isSameSemesterCategory(SemesterNumber,CourseSemesterNumber,1), filterSameSemesterCategory(T,SemesterNumber,O). "+

        "filterSameSemesterCategory([H|T],SemesterNumber,O):- cs_course(H,CourseSemesterNumber,_), \\+isSameSemesterCategory(SemesterNumber,CourseSemesterNumber,1), filterSameSemesterCategory(T,SemesterNumber,O). "+

        /*--- getMaxHours ---*/

        "getMaxHours(Semester,SemesterHours):- cs_semester(Semester,SemesterHours), SemesterHours>=34. "+

        "getMaxHours(Semester,34):- cs_semester(Semester,SemesterHours), Temp is SemesterHours+3, SemesterHours<34, Temp>34. "+

        "getMaxHours(Semester,TotalHours):- cs_semester(Semester,SemesterHours), TotalHours is SemesterHours+3, TotalHours=<34. "+

        /*--- soFarCourses ---*/

        "soFarCourses(0,[]). "+

        "soFarCourses(Semester,Courses):- cs_semester_courses(Semester,SemesterCourses), NextSemester is Semester-1, soFarCourses(NextSemester,OtherCourses), append(OtherCourses,SemesterCourses,Courses). "+

        /*--- getNextDECourse ---*/

        "getNextDECourse(StudentID,CourseCode):- studentPassedCourses(StudentID,Courses), filterLangCourses(de,Courses,DECoursesTaken), highestLangCourse(de,DECoursesTaken,HighestDETaken), filterTill(de,HighestDETaken,[de101,de202,de303,de404],LeftDECourses), getLangHead(LeftDECourses,CourseCode). "+

        "getNextDECourse(StudentID,[de101]):- studentPassedCourses(StudentID,Courses), filterLangCourses(de,Courses,[]). "+

        /*--- getNextENGCourse ---*/

        "getNextENGCourse(StudentID,CourseCode):- studentPassedCourses(StudentID,Courses), filterLangCourses(eng,Courses,ENGCoursesTaken), highestLangCourse(eng,ENGCoursesTaken,HighestENGTaken), filterTill(eng,HighestENGTaken,[ae101,as102,sm101,cps402,rpw401],LeftENGCourses), getLangHead(LeftENGCourses,CourseCode). "+

        "getNextENGCourse(StudentID,[ae101]):- studentPassedCourses(StudentID,Courses), filterLangCourses(eng,Courses,[]). "+

        /*--- getLangHead ---*/

        "getLangHead([],[]). "+

        "getLangHead([H|_],[H]):- lang_course(_,_,H,_). "+

        /*--- filterLangCourses ---*/

        "filterLangCourses(_,[],[]). "+

        "filterLangCourses(Lang,[H|T],[H|TT]):- lang_course(Lang,_,H,_), filterLangCourses(Lang,T,TT). "+

        "filterLangCourses(Lang,[H|T],TT):- \\+lang_course(Lang,_,H,_), filterLangCourses(Lang,T,TT). "+

        /*--- highestLangCourse ---*/

        "highestLangCourse(Lang,[H|T],HighestLangCourse):- highestLangHelper(Lang,T,H,HighestLangCourse). "+

        "highestLangHelper(_,[],X,X). "+

        "highestLangHelper(Lang,[H|T],HighestSoFar,HighestLangCourse):- lang_course(Lang,ThisLevel,H,_), lang_course(Lang,Level,HighestSoFar,_), ThisLevel>Level, highestLangHelper(Lang,T,H,HighestLangCourse). "+

        "highestLangHelper(Lang,[H|T],HighestSoFar,HighestLangCourse):- lang_course(Lang,ThisLevel,H,_), lang_course(Lang,ThisLevel,H,_), lang_course(Lang,Level,HighestSoFar,_), ThisLevel<Level, highestLangHelper(Lang,T,HighestSoFar,HighestLangCourse). "+

        /*--- filterTill ---*/

        "filterTill(_,_,[],[]). "+

        "filterTill(_,[],_,[]). "+

        "filterTill(Lang,HighestTakenCourse,[H|T],[H|TT]):- lang_course(Lang,ThisLevel,H,_), lang_course(Lang,Level,HighestTakenCourse,_), ThisLevel>Level, filterTill(Lang,HighestTakenCourse,T,TT). "+

        "filterTill(Lang,HighestTakenCourse,[H|T],TT):- lang_course(Lang,ThisLevel,H,_), lang_course(Lang,Level,HighestTakenCourse,_), ThisLevel=<Level, filterTill(Lang,HighestTakenCourse,T,TT). ";

  session.consult(program);

  session.query(thisQuery); // Query the goal

  var schedule;

  session.answers(x => { // Show answers
    var str = pl.format_answer(x);
    console.log("QUERY ENTERED: "+thisQuery);
    console.log("UNFORMATED PROLOG ANSWER--->"+str);
    var res = str.split("=");
    if(str!="false."){
      str = res[1].split("[");
      var length = str[1].length;
      var substring = str[1].substring(0,length-3);
      schedule = substring;
    }
  });

  console.log( "----> PROLOG ANSWER: " +schedule);
  
  return schedule; 
} 

module.exports = {
  getStudentNextSchedule: function(callback, studentID) {
    var scheduleQuery = "getSchedule("+studentID+",X).";
    var outputSchedule = executeQuery(scheduleQuery);
    callback(outputSchedule);                         
  }
}


