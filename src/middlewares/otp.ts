export const generateOTP = async(length = 6):Promise<string> => {
    try{
        const array = new Uint32Array(length);
        crypto.getRandomValues(array);
        const otp = Array.from(array,val => (val % 10).toString()).join('');
        return otp;
    }catch(err){
        throw new Error('Error creating otp: '+err);
    }
}