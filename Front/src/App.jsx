import { RouterProvider } from "react-router-dom"
import router from "./router"
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from "react-toastify";


function App() {

  return (
    <>
      <ToastContainer position="top-right" autoClose={2000} newestOnTop />
      <RouterProvider router={router} />
    </>
  )
}

export default App
