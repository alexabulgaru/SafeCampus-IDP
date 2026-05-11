import Navbar from "./components/navbar";
import SafeLanding from "../public/landing-page-photo.png";

export default function Home() {
  	return (
    	<div className="min-h-screen bg-[#f8a5c2] flex flex-col">
      		<Navbar />
      		<div className="flex-1 flex flex-col items-center justify-center px-4">
        		<img
          			src={SafeLanding.src}
          			alt="SafeCampus Landing"
 					className="max-w-full max-h-[70vh] w-auto h-auto object-contain rounded-2xl shadow-xl ring-1 ring-black/10 antialiased"
        		/>

        		<div className="mt-6 text-center">
          			<h1 className="text-3xl md:text-4xl font-extrabold text-white">
            			SAFE CAMPUS
          			</h1>
          			<p className="mt-2 text-lg md:text-xl text-white">
            			Your future, protected.
          			</p>
        		</div>
      		</div>
    	</div>
  	);
}
