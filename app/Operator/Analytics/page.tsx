import Filters from '@/components/operator/analytics/filter';
import ChartLineLinear from '@/components/operator/analytics/linechart';
import ChartBarDefault from '@/components/operator/analytics/barchart';
import ChartBarCodesDistribution from '@/components/operator/analytics/barcharty';
import ChartPieSimple from '@/components/operator/analytics/piechart';
import ChartPieCodes from '@/components/operator/analytics/piechart2';
import PaymentMethod from '@/components/operator/analytics/payment';
import TotalBookingsCard from '@/components/operator/analytics/total';
import RevenueCard from '@/components/operator/analytics/revenue';

export default function Analytics() {
 return (
   <div className="h-full  w-full bg-gray-200 flex items-center justify-center hide-scrollbar">
    <div className="h-full w-full bg-gray-200 flex gap-2 md:flex-row flex-col">  
      <div className="h-full w-[15%] bg-gray-200">
          <Filters/>
      </div> 
     <div className="h-full min-w-0   w-full bg-gray-200 flex gap-5  items-center justify-center hide-scrollbar ">  
      <div className="h-[95%] min-w-0  w-[95%] bg-gray-200 flex gap-5 md:flex-row flex-col ">  
          <div className="h-full min-w-0  w-[100%] bg-gray-200 gap-5 flex md:flex-col flex-col">    
              <div className="h-73 w-[100%] bg-gray-200 rounded-lg">
                  <ChartLineLinear/>
              </div> 
              <div className="h-69  w-[100%] bg-gray-200">
                  <ChartPieSimple/>
              </div> 
              <div className="h-65  w-[100%] bg-gray-200">
                  <ChartBarDefault/>
              </div> 
          </div> 
        </div> 
         <div className="h-[95%] w-[100%] bg-gray-200 pr-4">
           <div className="h-full w-full bg-gray-200 flex md:flex-col flex-col gap-5">    
             <div className="h-100 min-w-0 w-full bg-gray-200">
             <div className="h-full w-full bg-gray-200 flex gap-5  items-center justify-center hide-scrollbar">
                <div className="h-[100%]  w-[100%] bg-gray-200 flex gap-5 md:flex-row flex-col ">  
                  <div className="h-full min-w-0  w-[100%] bg-gray-200 flex gap-5 md:flex-col flex-col "> 
                      <div className="h-[50%] min-w-0  w-[100%] bg-gray-200">
                        <TotalBookingsCard/>
                      </div>
                      <div className="h-[100%] min-w-0  w-[100%] bg-gray-200">
                        <ChartPieCodes/>
                      </div>
                  </div>
                  <div className="h-full min-w-0  w-[100%] bg-gray-200 flex gap-5 md:flex-col flex-row "> 
                      <div className="h-[50%] min-w-0  w-[100%] bg-gray-200">
                        <RevenueCard/>
                      </div>
                      <div className="h-[100%] min-w-0 w-[100%] bg-gray-200">
                        <PaymentMethod/>
                      </div>
                  </div>
                </div>
             </div> 
             </div> 
             <div className="h-120 w-full bg-gray-200">
             <div className="h-full w-full bg-gray-200">
                  <ChartBarCodesDistribution/>
             </div> 
             </div>
           </div> 
         </div> 
         </div> 
     </div>
   </div>
   )
 }