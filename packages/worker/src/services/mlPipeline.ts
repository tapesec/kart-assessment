// the Black box ML
export const processMLpipeline = async (
  pipelineName: string,
  duration: number
) => {
  // this is where the ML pipeline should be implemented
  // let's consider that the video previously stored in a S3 bucket is downloaded from here.
  // then the rest of the process that I don't implement
  await sleep(duration);
  console.log(`${pipelineName} done ! --------->`);
};
const sleep = async (duration: number) =>
  new Promise((resolve) => setTimeout(resolve, duration));
