import Header from "@/components/Header";
import SideBar from "@/components/SideBar";
import Footer from "@/components/Footer";

export const dynamic = "force-dynamic";

export default function MainLayout ({ children }) {
  return (
    <div className="flex flex-col h-screen">
      <Header/>
      <div className="flex flex-1 overflow-hidden">
        <SideBar/>
        <div className="flex-1 min-w-0 overflow-auto overflow-x-hidden bg-primary p-4 lg:p-8 rounded-tl-xl">
          <main className="min-w-0">{children}</main>
          <Footer/>
        </div>
      </div>
    </div>
  )
}