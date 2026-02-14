import request from './index'
import type {
  TimetableCellDTO,
  TeacherTimetableQuery,
  StudentTimetableQuery,
  ClassTimetableQuery,
  ClassroomTimetableQuery,
} from './types'

/**
 * 获取教师课表
 */
export function getTeacherTimetable(params: TeacherTimetableQuery): Promise<TimetableCellDTO[]> {
  return request({
    url: '/v1/schedule/timetable/teacher',
    method: 'get',
    params,
  })
}

/**
 * 获取学生课表
 */
export function getStudentTimetable(params: StudentTimetableQuery): Promise<TimetableCellDTO[]> {
  return request({
    url: '/v1/schedule/timetable/student',
    method: 'get',
    params,
  })
}

/**
 * 获取班级课表
 */
export function getClassTimetable(params: ClassTimetableQuery): Promise<TimetableCellDTO[]> {
  return request({
    url: '/v1/schedule/timetable/class',
    method: 'get',
    params,
  })
}

/**
 * 获取教室课表
 */
export function getClassroomTimetable(params: ClassroomTimetableQuery): Promise<TimetableCellDTO[]> {
  return request({
    url: '/v1/schedule/timetable/classroom',
    method: 'get',
    params,
  })
}
