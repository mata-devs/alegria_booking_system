'use client'

import FullCalendar from '@fullcalendar/react'
// import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'


export default function AvailableSlots() {
    // in ani ang format sa data para events sunda josh
    const events = [
        {
            title: 'Tour 1',
            start: '2026-02-10T08:00:00',
            end: '2026-02-10T12:00:00',
            extendedProps: {
                slots: '20/30',
                status: 'available',
            },
        },
        {
            title: 'Tour 2',
            start: '2026-02-11T08:00:00',
            end: '2026-02-11T10:00:00',
            extendedProps: {
                slots: '30/30',
                status: 'full',
            },
        },
        {
            title: 'Tour 3',
            start: '2026-02-11T13:00:00',
            end: '2026-02-11T15:00:00',
            extendedProps: {
                slots: '29/30',
                status: 'limited',
            },
        },
    ]

    return(
        <div className="w-full flex flex-col h-[50vh] gap-[3%] border-[3px] border-[#9F9F9F] rounded-[20px] bg-[#FFFFFF] pt-[3%] pr-[5%] pl-[5%] pb-[5%]">
            <div className="font-poppins font-semibold text-[#000000] text-[36px] pt-[1%] pb-[1%] ">
                Available Slots
                <div
                    className='text-sm'
                >
                    <FullCalendar
                        plugins={[ timeGridPlugin]}
                        initialView="timeGridWeek"
                        events={events}
                        headerToolbar={{
                            left: 'prev',
                            center: 'title',
                            right: 'next'
                        }}
                        contentHeight={300}
                        aspectRatio={2}
                        allDaySlot={false}
                        eventContent={(arg) => {
                            const { title } = arg.event
                            const { slots, status } = arg.event.extendedProps

                            const statusStyles = {
                                available: 'border-green-500 text-green-600 bg-green-50',
                                limited: 'border-yellow-500 text-yellow-600 bg-yellow-50',
                                full: 'border-red-500 text-red-600 bg-red-50',
                            }

                            return (
                            <div 
                                className={`w-full h-full p-2 text-xs font-medium ${statusStyles[status as keyof typeof statusStyles]}`}
                            >
                                <div className="font-semibold">{title}</div>
                                <div className="text-[10px] opacity-70">
                                    {arg.timeText}
                                </div>
                                <div className="mt-1 flex items-center gap-1">
                                    <span>Slots</span>
                                    <span className="font-semibold">{slots}</span>
                                </div>
                            </div>
                            )
                        }}
                    />
                </div>
                <hr className="w-full border-t-3 border-[#9D9D9D]"/>
            </div>

        </div>
    )
}