import { motion } from "framer-motion";

const LoadingScreen = () => {

  return (

    <div className="h-screen flex items-center justify-center bg-[#1f3a5f]">

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="text-center"
      >

        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="mb-6"
        >
          <div className="w-10 h-10 bg-orange-500 rounded-full"></div>
        </motion.div>

        <h1 className="text-3xl font-bold text-white">
          Collab<span className="text-orange-400">Core</span>
        </h1>

        <p className="text-gray-200 mt-2">
          Building collaboration into reality
        </p>

      </motion.div>

    </div>

  );

};

export default LoadingScreen;